import { supabaseAdminClient } from "../supabase";

export const updateArticleThumbnail = async (
  articleId: string,
  assetId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("articles")
      .update({ 
        thumbnail_id: assetId,
        image_url: null, // Will be fetched from asset when displaying
      })
      .eq("id", articleId);

    if (error) {
      console.error("Error updating article thumbnail:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const updateAuthorImageRef = async (
  authorId: string,
  assetId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("authors")
      .update({ image_ref: assetId })
      .eq("id", authorId);

    if (error) {
      console.error("Error updating author image_ref:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getAllArticles = async (
  search?: string,
  limit = 20,
): Promise<Array<{ id: string; title: string; slug: string }>> => {
  try {
    let query = supabaseAdminClient
      .from("articles")
      .select("id, title, slug")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getAllAuthors = async (
  search?: string,
  limit = 20,
): Promise<Array<{ id: string; name: string; image_url: string | null }>> => {
  try {
    let query = supabaseAdminClient
      .from("authors")
      .select("id, name, image_url")
      .order("name", { ascending: true })
      .limit(limit);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching authors:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};