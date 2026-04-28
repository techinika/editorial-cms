import { supabaseAdminClient } from "../supabase";

export interface ArticleAsset {
  id: string;
  created_at: string;
  article_id: string;
  asset_id: string;
  caption: string | null;
  position: number | null;
}

export const addArticleAsset = async (
  articleId: string,
  assetId: string,
  caption?: string,
  position?: number,
): Promise<ArticleAsset | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_assets")
      .insert({
        article_id: articleId,
        asset_id: assetId,
        caption: caption || null,
        position: position || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding article asset:", error);
      return null;
    }

    return data as unknown as ArticleAsset;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getArticleAssets = async (
  articleId: string,
): Promise<ArticleAsset[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_assets")
      .select(`
        *,
        asset:assets (*)
      `)
      .eq("article_id", articleId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching article assets:", error);
      return [];
    }

    return data as unknown as ArticleAsset[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const removeArticleAsset = async (
  articleId: string,
  assetId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("article_assets")
      .delete()
      .eq("article_id", articleId)
      .eq("asset_id", assetId);

    if (error) {
      console.error("Error removing article asset:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const updateArticleAssetCaption = async (
  id: string,
  caption: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("article_assets")
      .update({ caption })
      .eq("id", id);

    if (error) {
      console.error("Error updating article asset caption:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
