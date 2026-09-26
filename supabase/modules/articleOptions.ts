import { getSupabaseAdminClient } from "../supabase";
import type { ArticleOption } from "@/types/video";

/**
 * Minimal article lookup for the video form's "related article" picker.
 *
 * Deliberately not the CMS's own article module: those functions select the
 * full article row with author, category and thumbnail joins, which is a lot of
 * payload to ship on every keystroke of a typeahead. This returns id/title/slug
 * only.
 *
 * Service-role client, like the video module — the same RLS reasoning applies
 * (an anon client here would only see published articles, and the CMS is not
 * the place to enforce that).
 */
export async function searchArticleOptions(
  query: string,
  limit = 12,
): Promise<ArticleOption[]> {
  const term = (query || "").trim();

  let req = getSupabaseAdminClient()
    .from("articles")
    .select("id,title,slug,status")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (term) {
    // `.or()` is PostgREST filter syntax, not SQL: strip the characters that
    // would otherwise be parsed as operators and let a stray comma turn the
    // filter into a syntax error.
    const safe = term.replace(/[,%()]/g, " ").trim();
    if (safe) {
      req = req.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%`);
    }
  }

  const { data, error } = await req;
  if (error) {
    console.error("Error searching articles:", error);
    return [];
  }
  return (data as ArticleOption[]) ?? [];
}
