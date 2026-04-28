import { supabaseAdminClient } from "../supabase";
import { Author } from "@/types/author";

export const updateArticleThumbnail = async (
  articleId: string,
  assetId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("articles")
      .update({
        thumbnail_id: assetId,
        image: null,
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

export const getAllAuthorsWithRoles = async (
  search?: string,
): Promise<Author[]> => {
  try {
    let query = supabaseAdminClient
      .from("authors")
      .select(`
        *,
        imageAsset:assets!image_ref (id, url)
      `)
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching authors:", error);
      return [];
    }

    return data as unknown as Author[];
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
      .eq("role", "author")
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

export const updateAuthorRole = async (
  authorId: string,
  role: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("authors")
      .update({ role })
      .eq("id", authorId);

    if (error) {
      console.error("Error updating author role:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const toggleAuthorAdmin = async (
  authorId: string,
  isAdmin: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("authors")
      .update({ is_admin: isAdmin })
      .eq("id", authorId);

    if (error) {
      console.error("Error toggling admin:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const toggleAuthorActive = async (
  authorId: string,
  active: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("authors")
      .update({ active })
      .eq("id", authorId);

    if (error) {
      console.error("Error toggling active:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const createAuthor = async (
  userId: string,
  name: string,
  role: string = "author",
  lang: string = "en",
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient.from("authors").insert({
      id: userId,
      name,
      role,
      lang,
    });

    if (error) {
      console.error("Error creating author:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const deleteAuthor = async (authorId: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("authors")
      .delete()
      .eq("id", authorId);

    if (error) {
      console.error("Error deleting author:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
