import { ArticleCompanyMatch } from "@/types/article-company";
import { getSupabase } from "../supabase";

const matchSelect = `
  id, article_id, company_id, created_at,
  company:featured_startups (id, name, slug, description, industry, image_ref, image:assets!image_ref(id, url))
`;

export const getArticleCompanyMatches = async (
  articleId: string,
): Promise<ArticleCompanyMatch[]> => {
  try {
    const { data, error } = await getSupabase()
      .from("article_companies")
      .select(matchSelect)
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching article company matches:", error);
      return [];
    }

    return (data || []) as unknown as ArticleCompanyMatch[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createArticleCompanyMatch = async (
  articleId: string,
  companyId: string,
): Promise<boolean> => {
  try {
    const { error } = await getSupabase()
      .from("article_companies")
      .upsert(
        { article_id: articleId, company_id: companyId },
        { onConflict: "article_id,company_id", ignoreDuplicates: true },
      );

    if (error) {
      console.error("Error creating article company match:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const deleteArticleCompanyMatch = async (
  matchId: number,
): Promise<boolean> => {
  try {
    const { error } = await getSupabase()
      .from("article_companies")
      .delete()
      .eq("id", matchId);

    if (error) {
      console.error("Error deleting article company match:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
