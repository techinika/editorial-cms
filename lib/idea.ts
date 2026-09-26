import type {
  AssignableAuthor,
  ContentType,
  IdeaStatus,
} from "@/types/idea";

/**
 * Pure helpers for the article-ideas pipeline. Kept out of the routes and the
 * components so the rules — what a stage means, whether an idea can be
 * converted, how a pitch becomes an article brief — are testable without a
 * request or a database.
 */

export const IDEA_STATUSES: IdeaStatus[] = [
  "idea",
  "draft",
  "in_progress",
  "pending_publishing",
  "publishing",
  "published",
  "declined",
];

/** The stages the editorial team works through, in order, for the board view. */
export const PIPELINE: IdeaStatus[] = [
  "idea",
  "draft",
  "in_progress",
  "pending_publishing",
  "publishing",
];

/** Terminal states, shown after the pipeline rather than as a column. */
export const TERMINAL_STATUSES: IdeaStatus[] = ["published", "declined"];

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: "Idea",
  draft: "Draft",
  in_progress: "In progress",
  pending_publishing: "Pending publishing",
  publishing: "Publishing",
  published: "Published",
  declined: "Declined",
};

export const IDEA_STATUS_STYLES: Record<IdeaStatus, string> = {
  idea: "bg-gray-100 text-gray-700",
  draft: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  pending_publishing: "bg-purple-100 text-purple-800",
  publishing: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  editorial: "Editorial",
  commercial: "Commercial",
};

/** Fills `content` from a `datetime-local` value. */
export function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Picks a slug that isn't taken, given the slugs already in use.
 *
 * `articles` has a unique constraint on (slug, lang) — not on slug alone — so
 * two English pieces can't share a slug but an English and a French one can.
 * The caller passes the slugs to avoid for the language being written, and this
 * appends -2, -3, ... until one is free. Real inserts still race, which is why
 * the convert route also retries on a unique-violation.
 */
export function uniqueSlug(title: string, taken: Iterable<string>): string {
  const base = slugify(title) || `story-${Date.now().toString(36)}`;
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 500; n++) {
    const candidate = `${base.slice(0, 80 - String(n).length - 1)}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * A conversion target needs an assignee, because the article has to inherit one
 * as its author — an article with no author is unowned work that nobody is
 * obliged to pick up.
 */
export function canConvert(idea: {
  assigned_author_id: string | null;
  article_id: string | null;
}): { ok: boolean; reason?: string } {
  if (idea.article_id) {
    return { ok: false, reason: "This idea has already been turned into an article" };
  }
  if (!idea.assigned_author_id) {
    return {
      ok: false,
      reason: "Assign an author before turning this into an article",
    };
  }
  return { ok: true };
}

/**
 * The article body a converted idea starts from.
 *
 * Deliberately not empty: the author opens the draft to find the brief, the
 * lead's contact details and the source link, so the pitch survives the
 * hand-off instead of living only in the ideas table. A generated comment
 * marks it clearly enough to be replaced and is not rendered as content.
 */
export function buildDraftBody(idea: {
  concept: string | null;
  notes: string | null;
  source_url: string | null;
  lead_name: string | null;
  contact_email: string | null;
}): string {
  const parts: string[] = [
    "<!-- Created from an editorial idea. Replace this brief with the article. -->",
  ];

  if (idea.concept?.trim()) {
    parts.push(`<h2>Brief</h2>`, `<p>${escapeHtml(idea.concept.trim())}</p>`);
  }
  if (idea.notes?.trim()) {
    parts.push(`<h2>Notes</h2>`, `<p>${escapeHtml(idea.notes.trim())}</p>`);
  }
  const lead: string[] = [];
  if (idea.lead_name?.trim()) lead.push(idea.lead_name.trim());
  if (idea.contact_email?.trim()) lead.push(idea.contact_email.trim());
  if (lead.length) {
    parts.push(`<h2>Lead</h2>`, `<p>${escapeHtml(lead.join(" — "))}</p>`);
  }
  if (idea.source_url?.trim()) {
    const url = safeHttpUrl(idea.source_url.trim());
    if (url) {
      parts.push(
        `<h2>Source</h2>`,
        `<p><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></p>`
      );
    }
  }

  return parts.join("\n");
}

/** The card summary, derived from the brief when the idea didn't carry one. */
export function summaryFromConcept(concept: string | null): string {
  const text = (concept || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length <= 200 ? text : `${text.slice(0, 197).trimEnd()}…`;
}

/** Only ever emit a real http(s) URL into stored content. */
export function safeHttpUrl(value: string): string | null {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The assignee, or null. Used to decide who may convert. */
export function isAssignedTo(
  idea: { assigned_author_id: string | null },
  userId: string | null | undefined,
): boolean {
  return Boolean(userId) && idea.assigned_author_id === userId;
}

export type { AssignableAuthor };
