import { JoinedArticle, ArticleFormData, Article } from "@/types/article";
import { Category } from "@/types/category";
import supabase from "../supabase";

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const createArticle = async (
  data: ArticleFormData,
): Promise<Article | null> => {
  try {
    const slug = data.slug || generateSlug(data.title);

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        title: data.title,
        slug,
        content: data.content,
        image: data.image || null,
        category_id: data.category_id || null,
        tags: data.tags || null,
        summary: data.summary || null,
        read_time: data.read_time || null,
        lang: data.lang || "english",
        status: data.status || "draft",
        author_id: data.author_id || null,
        author_name: data.author_name || null,
        drafted_at: data.status === "draft" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating article:", error);
      return null;
    }

    return article as Article;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateArticle = async (
  id: string,
  data: Partial<ArticleFormData>,
): Promise<Article | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    if (data.title && !data.slug) {
      updateData.slug = generateSlug(data.title);
    }

    if (data.status === "draft" && !data.drafted_at) {
      updateData.drafted_at = new Date().toISOString();
    }

    const { data: article, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating article:", error);
      return null;
    }

    return article as Article;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const publishArticle = async (id: string): Promise<Article | null> => {
  return updateArticle(id, {
    status: "published",
    date: new Date().toISOString(),
  });
};

export const getArticleById = async (
  id: string,
): Promise<JoinedArticle | null> => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching article:", error);
      return null;
    }

    return data as unknown as JoinedArticle;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getArticles = async (
  page = 0,
  limit = 12,
): Promise<JoinedArticle[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const searchArticles = async (
  query: string,
): Promise<JoinedArticle[]> => {
  if (!query.trim()) {
    return getArticles(0, 12);
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(
        `
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `,
      )
      .or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,tags.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data as Category[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export type ArticleFilter = {
  status?: "draft" | "published" | "cancelled";
  category_id?: string;
  author_id?: string;
};

export const getFilteredArticles = async (
  filter: ArticleFilter,
  page = 0,
  limit = 12,
): Promise<JoinedArticle[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("articles")
      .select(
        `
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filter.status) {
      query = query.eq("status", filter.status);
    }

    if (filter.category_id) {
      query = query.eq("category_id", filter.category_id);
    }

    if (filter.author_id) {
      query = query.eq("author_id", filter.author_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching filtered articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createCategory = async (
  name: string,
  description?: string,
  lang = "en",
): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        description: description || null,
        lang,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return null;
    }

    return data as Category;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateCategory = async (
  id: string,
  data: { name?: string; description?: string },
): Promise<Category | null> => {
  try {
    const { data: category, error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return null;
    }

    return category as Category;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const deleteArticle = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      console.error("Error deleting article:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
