import { getSupabaseAdminClient } from "../supabase";
import type { ArticleIdea } from "@/types/idea";
import {
  buildDraftBody,
  canConvert,
  slugify,
  summaryFromConcept,
} from "@/lib/idea";

/**
 * Turns an idea into a real row in `articles`.
 *
 * Service-role, and it writes `articles` directly rather than going through
 * createArticle() in modules/articles.ts — that one inserts with the *anon*
 * client, which works only because an anon INSERT policy happens to exist, and
 * it can't be pointed at an explicit author. Here the author is not a
 * parameter: it is the idea's assignee, full stop, which is the whole point of
 * the "an idea must be assigned before it can become an article" rule.
 *
 * The conversion is a claim, a write, a link, a release — see the comment on
 * `article_ideas.converting_at` in the migration for why the claim comes first.
 */

export type ConvertResult =
  | { ok: true; article: Record<string, unknown>; idea: ArticleIdea }
  | {
      ok: false;
      code: "not_found" | "unassigned" | "already_converted" | "busy" | "failed";
      message: string;
    };

const LANG = "english";

/**
 * How long a claim may stand before another attempt may take it over. Only
 * matters if a request dies between claiming and linking, which leaves the idea
 * looking busy with nobody holding it. Five minutes is far longer than a
 * normal conversion takes.
 */
const CLAIM_STALE_AFTER_MS = 5 * 60 * 1000;

async function nowIso(): Promise<string> {
  return new Date().toISOString();
}

/**
 * Attempts to take exclusive ownership of this idea's conversion.
 *
 * One conditional UPDATE under a Postgres row lock, so of two concurrent
 * callers exactly one matches. Returns false if the idea is already converted,
 * already being converted, or gone.
 */
async function claimIdea(ideaId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = await nowIso();

  const fresh = await admin
    .from("article_ideas")
    .update({ converting_at: now })
    .eq("id", ideaId)
    .is("article_id", null)
    .is("converting_at", null)
    .select("id");

  if (!fresh.error && (fresh.data?.length ?? 0) > 0) return true;

  if (fresh.error) {
    console.error("Error claiming article idea:", fresh.error);
    return false;
  }

  // Held by someone else. Take it over only if the claim has gone stale.
  const cutoff = new Date(Date.now() - CLAIM_STALE_AFTER_MS).toISOString();
  const stale = await admin
    .from("article_ideas")
    .update({ converting_at: now })
    .eq("id", ideaId)
    .is("article_id", null)
    .not("converting_at", "is", null)
    .lt("converting_at", cutoff)
    .select("id");

  if (stale.error) {
    console.error("Error reclaiming stale article idea claim:", stale.error);
    return false;
  }
  return (stale.data?.length ?? 0) > 0;
}

/** Releases the claim without linking anything, so a failure isn't terminal. */
async function releaseClaim(ideaId: string): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from("article_ideas")
    .update({ converting_at: null })
    .eq("id", ideaId)
    .is("article_id", null);

  if (error) {
    console.error("Error releasing article idea claim:", error);
  }
}

/**
 * Converts an idea into a draft article, or explains why it can't.
 *
 * The idea must already be assigned: the article inherits the assignee as its
 * author, so an unassigned pitch has nobody to belong to.
 */
export async function convertIdeaToArticle(  idea: ArticleIdea,
): Promise<ConvertResult> {
  const check = canConvert(idea);
  if (!check.ok) {
    return {
      ok: false,
      code: idea.article_id ? "already_converted" : "unassigned",
      message: check.reason ?? "This idea cannot be converted",
    };
  }

  if (!(await claimIdea(idea.id))) {
    return {
      ok: false,
      code: "busy",
      message: "This idea is already being turned into an article",
    };
  }

  // From here on every exit path must release the claim, or the idea looks
  // busy for five minutes.
  try {
    // The assignee's display name, for articles.author_name. The blog falls
    // back to this when the author join is unavailable.
    const authorName = idea.assigned_author?.name ?? null;

    const baseSlug = slugify(idea.title) || `idea-${Date.now().toString(36)}`;

    const draftBody = buildDraftBody(idea);
    const summary = summaryFromConcept(idea.concept);

    const row = {
      title: idea.title,
      content: draftBody,
      summary: summary || null,
      status: "draft",
      lang: LANG,
      author_id: idea.assigned_author_id,
      author_name: authorName,
      drafted_at: await nowIso(),
      content_type: idea.content_type,
      partner_id: idea.partner_id,
      sponsored: false,
    };

    const admin = getSupabaseAdminClient();
    let inserted: Record<string, unknown> | null = null;
    let lastError: string | null = null;

    // `articles` is unique on (slug, lang), not on slug alone. Two editors can
    // reach the same free slug between our read and our insert, so let the
    // constraint decide and try the next suffix.
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const { data, error } = await admin
        .from("articles")
        .insert({ ...row, slug: attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}` })
        .select()
        .single();

      if (!error && data) {
        inserted = data as Record<string, unknown>;
        break;
      }

      lastError = error?.message ?? "Unknown error";
      const isSlugConflict = /slug/i.test(lastError);
      if (!isSlugConflict) {
        console.error("Error inserting article for idea:", lastError);
        await releaseClaim(idea.id);
        return {
          ok: false,
          code: "failed",
          message: "Could not create the article. Please try again.",
        };
      }
    }

    if (!inserted) {
      console.error("Could not find a free slug for idea conversion:", lastError);
      await releaseClaim(idea.id);
      return {
        ok: false,
        code: "failed",
        message: "Could not find a free slug for this title. Please try again.",
      };
    }

    // Link the idea back and finish the conversion in the same update that
    // releases the claim.
    const { data: updated, error: linkError } = await admin
      .from("article_ideas")
      .update({
        article_id: inserted.id as string,
        converted_at: await nowIso(),
        converting_at: null,
        status: "draft",
        updated_at: await nowIso(),
      })
      .eq("id", idea.id)
      .is("article_id", null)
      .select()
      .single();

    if (linkError || !updated) {
      // The draft exists but the link didn't land. Say so explicitly rather
      // than leaving an orphan draft and a misleading "nothing happened".
      console.error("Article created but linking the idea failed:", linkError);
      return {
        ok: false,
        code: "failed",
        message:
          "The draft was created but the idea could not be linked to it. " +
          "Check the articles list for a duplicate before retrying.",
      };
    }

    return { ok: true, article: inserted, idea: updated as ArticleIdea };
  } catch (error) {
    console.error("Error converting idea to article:", error);
    await releaseClaim(idea.id);
    return {
      ok: false,
      code: "failed",
      message: "Could not create the article. Please try again.",
    };
  }
}
