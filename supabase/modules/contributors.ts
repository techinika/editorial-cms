import { ArticleContributor } from "@/types/article";
import { supabaseAdminClient } from "../supabase";

export const getArticleContributors = async (
  articleId: string,
): Promise<ArticleContributor[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_contributors")
      .select(
        `
        *,
        author:authors!author_id (name, image_url)
      `,
      )
      .eq("article_id", articleId);

    if (error) {
      console.error("Error fetching contributors:", error);
      return [];
    }

    return data as unknown as ArticleContributor[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const addContributor = async (
  articleId: string,
  authorId: string,
): Promise<ArticleContributor | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_contributors")
      .insert({
        article_id: articleId,
        author_id: authorId,
      })
      .select(
        `
        *,
        author:authors!author_id (name, image_url)
      `,
      )
      .single();

    if (error) {
      console.error("Error adding contributor:", error);
      return null;
    }

    return data as unknown as ArticleContributor;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const removeContributor = async (
  contributorId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("article_contributors")
      .delete()
      .eq("id", contributorId);

    if (error) {
      console.error("Error removing contributor:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const updateArticleOwner = async (
  articleId: string,
  newAuthorId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("articles")
      .update({ author_id: newAuthorId })
      .eq("id", articleId);

    if (error) {
      console.error("Error updating article owner:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getAllAuthors = async (): Promise<
  { id: string; name: string; image_url: string | null }[]
> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("authors")
      .select("id, name, image_url")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching authors:", error);
      return [];
    }

    return data as { id: string; name: string; image_url: string | null }[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getAuthorInfo = async (
  authorId: string,
): Promise<{ created_at: string; name: string } | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("authors")
      .select("created_at, name")
      .eq("id", authorId)
      .single();

    if (error) {
      console.error("Error fetching author info:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export interface ContributorArticle {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  status: string | null;
  views: number;
  author: {
    name: string | null;
  } | null;
}

export const getUserContributedArticles = async (
  userId: string,
): Promise<ContributorArticle[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_contributors")
      .select("article_id")
      .eq("author_id", userId);

    if (error) {
      console.error("Error fetching contributed articles:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const articleIds = data.map((d) => d.article_id);

    const { data: articles, error: articlesError } = await supabaseAdminClient
      .from("articles")
      .select(
        `
        id,
        title,
        slug,
        image,
        status,
        views,
        author:authors!inner (name)
      `,
      )
      .in("id", articleIds);

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      return [];
    }

    return (articles || []).map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      image: article.image,
      status: article.status,
      views: article.views,
      author: article.author?.[0] || null,
    }));
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};