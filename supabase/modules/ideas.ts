import { getSupabaseAdminClient } from "../supabase";
import type {
  ArticleIdea,
  ArticleIdeaInput,
  AssignableAuthor,
  IdeaStatus,
} from "@/types/idea";

/**
 * The editorial ideas pipeline.
 *
 * Service-role only, like supabase/modules/videos.ts. `article_ideas` has RLS
 * enabled with no anon or authenticated policy (see
 * supabase/migrations/20260926_create_article_ideas_and_partners.sql), so an
 * anon read returns nothing at all. These rows carry a lead's personal contact
 * details and unpublished editorial strategy — there is no reason for the
 * public key to reach any of it, and every query here runs on the server.
 */

const IDEA_SELECT = `
  *,
  assigned_author:authors!article_ideas_assigned_author_id_fkey (id, name, username, image_url),
  partner:partners!article_ideas_partner_id_fkey (id, name, slug),
  article:articles!article_ideas_article_id_fkey (id, title, slug, status)
`;

export interface ListIdeasOptions {
  status?: IdeaStatus | "all";
  search?: string;
  assignedTo?: string | null;
  unassignedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listIdeas(
  options: ListIdeasOptions = {},
): Promise<{ ideas: ArticleIdea[]; total: number }> {
  const {
    status = "all",
    search,
    assignedTo,
    unassignedOnly = false,
    page = 1,
    pageSize = 100,
  } = options;

  let query = getSupabaseAdminClient()
    .from("article_ideas")
    .select(IDEA_SELECT, { count: "exact" });

  if (status !== "all") query = query.eq("status", status);
  if (assignedTo) query = query.eq("assigned_author_id", assignedTo);
  if (unassignedOnly) query = query.is("assigned_author_id", null);

  if (search?.trim()) {
    // Same reasoning as the video list: ilike over the tsvector index, because
    // the index is built 'simple' for the public site and partial-word matching
    // is what an editor scanning a list actually wants. Strip the characters
    // PostgREST's filter parser treats as syntax, or a comma is a 400.
    const term = search.trim().replace(/[,%()]/g, " ");
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,concept.ilike.%${term}%,lead_name.ilike.%${term}%`
      );
    }
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Error listing article ideas:", error);
    return { ideas: [], total: 0 };
  }
  return { ideas: (data as ArticleIdea[]) ?? [], total: count ?? 0 };
}

export async function getIdeaById(id: string): Promise<ArticleIdea | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("article_ideas")
    .select(IDEA_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching article idea:", error);
    return null;
  }
  return (data as ArticleIdea) ?? null;
}

export async function createIdea(
  input: ArticleIdeaInput,
): Promise<ArticleIdea | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("article_ideas")
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select(IDEA_SELECT)
    .single();

  if (error) {
    console.error("Error creating article idea:", error);
    return null;
  }
  return data as ArticleIdea;
}

export async function updateIdea(
  id: string,
  input: Partial<ArticleIdeaInput>,
): Promise<ArticleIdea | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("article_ideas")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(IDEA_SELECT)
    .single();

  if (error) {
    console.error("Error updating article idea:", error);
    return null;
  }
  return data as ArticleIdea;
}

export async function deleteIdea(id: string): Promise<boolean> {
  const { error } = await getSupabaseAdminClient()
    .from("article_ideas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting article idea:", error);
    return false;
  }
  return true;
}

/** Authors an idea can be assigned to. */
export async function getAssignableAuthors(): Promise<AssignableAuthor[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("authors")
    .select("id,name,username,image_url")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching authors for assignment:", error);
    return [];
  }
  return (data as AssignableAuthor[]) ?? [];
}
