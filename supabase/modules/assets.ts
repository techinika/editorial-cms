import { Asset, AssetFormData } from "@/types/asset";
import { supabaseAdminClient } from "../supabase";

const assetSelect = `
  *,
  author:authors!author_id (id, name, image_url)
`;

export const createAsset = async (
  data: AssetFormData,
): Promise<Asset | null> => {
  try {
    const { data: asset, error } = await supabaseAdminClient
      .from("assets")
      .insert({
        name: data.name,
        url: data.url,
        type: data.type,
        author_id: data.author_id || null,
      })
      .select(assetSelect)
      .single();

    if (error) {
      console.error("Error creating asset:", error);
      return null;
    }

    return asset as unknown as Asset;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateAsset = async (
  id: string,
  data: Partial<AssetFormData>,
): Promise<Asset | null> => {
  try {
    const { data: asset, error } = await supabaseAdminClient
      .from("assets")
      .update(data)
      .eq("id", id)
      .select(assetSelect)
      .single();

    if (error) {
      console.error("Error updating asset:", error);
      return null;
    }

    return asset as unknown as Asset;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getAssetById = async (
  id: string,
): Promise<Asset | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("assets")
      .select(assetSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching asset:", error);
      return null;
    }

    return data as unknown as Asset;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getAssets = async (
  page = 0,
  limit = 20,
  userId?: string | null,
  isAdmin = false,
): Promise<Asset[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    let query = supabaseAdminClient
      .from("assets")
      .select(assetSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!isAdmin && userId) {
      query = query.eq("author_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching assets:", error);
      return [];
    }

    return data as unknown as Asset[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getAssetsByType = async (
  type: "image" | "video" | "doc",
  page = 0,
  limit = 20,
  userId?: string | null,
  isAdmin = false,
): Promise<Asset[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    let query = supabaseAdminClient
      .from("assets")
      .select(assetSelect)
      .eq("type", type)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!isAdmin && userId) {
      query = query.eq("author_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${type} assets:`, error);
      return [];
    }

    return data as unknown as Asset[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const searchAssets = async (
  query: string,
  userId?: string | null,
  isAdmin = false,
): Promise<Asset[]> => {
  if (!query.trim()) {
    return getAssets(0, 20, userId, isAdmin);
  }

  try {
    let supabaseQuery = supabaseAdminClient
      .from("assets")
      .select(assetSelect)
      .or(`name.ilike.%${query}%,url.ilike.%${query}%,type.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (!isAdmin && userId) {
      supabaseQuery = supabaseQuery.eq("author_id", userId);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("Error searching assets:", error);
      return [];
    }

    return data as unknown as Asset[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("assets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting asset:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getAssetUsage = async (
  assetId: string,
): Promise<{ articles: Array<{ id: string; title: string; slug: string; field: string }> }> => {
  try {
    const { data: asset, error: assetError } = await supabaseAdminClient
      .from("assets")
      .select("url")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      console.error("Error fetching asset:", assetError);
      return { articles: [] };
    }

    const articles: Array<{ id: string; title: string; slug: string; field: string }> = [];

    const { data: thumbnailArticles, error: thumbError } = await supabaseAdminClient
      .from("articles")
      .select("id, title, slug")
      .eq("thumbnail_id", assetId);

    if (!thumbError && thumbnailArticles) {
      thumbnailArticles.forEach((article) => {
        articles.push({ ...article, field: "thumbnail" });
      });
    }

    const { data: imageArticles, error: imgError } = await supabaseAdminClient
      .from("articles")
      .select("id, title, slug")
      .like("image", `%${asset.url}%`);

    if (!imgError && imageArticles) {
      imageArticles.forEach((article) => {
        if (!articles.find((a) => a.id === article.id)) {
          articles.push({ ...article, field: "image" });
        }
      });
    }

    const { data: featuredArticles, error: featError } = await supabaseAdminClient
      .from("articles")
      .select("id, title, slug")
      .like("featured_images", `%${asset.url}%`);

    if (!featError && featuredArticles) {
      featuredArticles.forEach((article) => {
        if (!articles.find((a) => a.id === article.id)) {
          articles.push({ ...article, field: "featured_images" });
        }
      });
    }

    const { data: contentArticles, error: contentError } = await supabaseAdminClient
      .from("articles")
      .select("id, title, slug")
      .like("content", `%${asset.url}%`);

    if (!contentError && contentArticles) {
      contentArticles.forEach((article) => {
        if (!articles.find((a) => a.id === article.id)) {
          articles.push({ ...article, field: "content" });
        }
      });
    }

    return { articles };
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return { articles: [] };
  }
};
