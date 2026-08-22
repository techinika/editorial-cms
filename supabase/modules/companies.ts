import { getSupabase } from "../supabase";
import { CompanyOption } from "@/types/article-company";

const companySelect =
  "id, name, slug, description, industry, image_ref, image:assets!image_ref(id, url)";

export const getCompanies = async (
  limit = 50,
): Promise<CompanyOption[]> => {
  try {
    const { data, error } = await getSupabase()
      .from("featured_startups")
      .select(companySelect)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching companies:", error);
      return [];
    }

    return (data || []) as unknown as CompanyOption[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const searchCompanies = async (
  query: string,
): Promise<CompanyOption[]> => {
  if (!query.trim()) {
    return getCompanies();
  }

  try {
    const { data, error } = await getSupabase()
      .from("featured_startups")
      .select(companySelect)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("name", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error searching companies:", error);
      return [];
    }

    return (data || []) as unknown as CompanyOption[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};
