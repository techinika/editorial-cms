import { getSupabaseAdminClient } from "../supabase";
import type { Partner, PartnerInput, PartnerOption } from "@/types/idea";

/**
 * Partners: the organisations we work with — sponsors, clients, and sources of
 * commissioned or partner content.
 *
 * Service-role only, same reasoning as modules/ideas.ts: `partners` has RLS on
 * with no anon policy. Contact details are internal, and the CMS only ever
 * needs to read this from the server.
 *
 * article_count is computed with a PostgREST embed rather than a view, so
 * adding a partner needs no extra migration.
 */
export async function listPartners(
  options: { includeInactive?: boolean; search?: string } = {},
): Promise<Partner[]> {
  const { includeInactive = true, search } = options;

  let query = getSupabaseAdminClient()
    .from("partners")
    .select("*,articles(count)")
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  if (search?.trim()) {
    const term = search.trim().replace(/[,%()]/g, " ");
    if (term) query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error listing partners:", error);
    return [];
  }

  // PostgREST returns `articles` as [{count: n}] for an aggregate embed.
  return ((data as unknown[]) ?? []).map((row) => {
    const r = row as Partner & { articles?: { count: number }[] };
    const { articles, ...partner } = r;
    return {
      ...partner,
      article_count: articles?.[0]?.count ?? 0,
    };
  });
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("partners")
    .select("*,articles(count)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching partner:", error);
    return null;
  }
  if (!data) return null;

  const r = data as Partner & { articles?: { count: number }[] };
  const { articles, ...partner } = r;
  return { ...partner, article_count: articles?.[0]?.count ?? 0 };
}

/** Just the active ones, for the article/idea partner pickers. */
export async function getActivePartners(): Promise<Partner[]> {
  return listPartners({ includeInactive: false });
}

export async function createPartner(
  input: PartnerInput,
): Promise<Partner | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("partners")
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error("Error creating partner:", error);
    return null;
  }
  return data as Partner;
}

export async function updatePartner(
  id: string,
  input: Partial<PartnerInput>,
): Promise<Partner | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("partners")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating partner:", error);
    return null;
  }
  return data as Partner;
}

/**
 * Deletes a partner. Articles and ideas that referenced it keep existing with
 * partner_id set to null (the FK is ON DELETE SET NULL) — the partnership may
 * have ended, but the record of what we published for them shouldn't vanish.
 * Pass deactivate instead if the history matters to you.
 */
export async function deletePartner(id: string): Promise<boolean> {
  const { error } = await getSupabaseAdminClient()
    .from("partners")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting partner:", error);
    return false;
  }
  return true;
}

/**
 * The minimal projection for a partner dropdown.
 *
 * Selects the four columns a picker renders and nothing else, so this can be
 * served to any authenticated editor — including an author tagging their own
 * article — without exposing a partner's contact email or internal notes the way
 * the admin list does.
 */
export async function getPartnerPickerOptions(): Promise<PartnerOption[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("partners")
    .select("id,name,slug,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching partner options:", error);
    return [];
  }
  return (data as PartnerOption[]) ?? [];
}
