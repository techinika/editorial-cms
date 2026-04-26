import { JoinedArticle, ArticleFormData, Article, ArticleFeedback, ArticleContributor } from "@/types/article";
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
  publishedByUserId?: string,
): Promise<Article | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    if (data.title && !data.slug) {
      updateData.slug = generateSlug(data.title);
    }

    if (data.status === "draft" && !data.drafted_at) {
      updateData.drafted_at = new Date().toISOString();
    }

    if (data.status === "published" && !data.published_at) {
      updateData.published_at = new Date().toISOString();
      if (publishedByUserId) {
        updateData.published_by = publishedByUserId;
      }
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

export const publishArticle = async (id: string, publishedByUserId: string): Promise<Article | null> => {
  return updateArticle(id, {
    status: "published",
    published_at: new Date().toISOString(),
    published_by: publishedByUserId,
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

export const getArticlesByStatus = async (
  status: "draft" | "published",
  page = 0,
  limit = 15,
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
      .eq("status", status)
.order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`Error fetching ${status} articles:`, error);
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

export interface UserStats {
  totalArticles: number;
  totalComments: number;
  totalViews: number;
  publishedArticles: number;
  draftArticles: number;
  cancelledArticles: number;
}

export const getAllStats = async (): Promise<UserStats> => {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("status, views, author_id");

    if (error) {
      console.error("Error fetching all articles:", error);
      return {
        totalArticles: 0,
        totalComments: 0,
        totalViews: 0,
        publishedArticles: 0,
        draftArticles: 0,
        cancelledArticles: 0,
      };
    }

    const totalArticles = articles?.length || 0;
    const publishedArticles =
      articles?.filter((a) => a.status === "published").length || 0;
    const draftArticles =
      articles?.filter((a) => a.status === "draft").length || 0;
    const cancelledArticles =
      articles?.filter((a) => a.status === "cancelled").length || 0;
    const totalViews =
      articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id");

    const totalComments = comments?.length || 0;

    return {
      totalArticles,
      totalComments,
      totalViews,
      publishedArticles,
      draftArticles,
      cancelledArticles,
    };
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return {
      totalArticles: 0,
      totalComments: 0,
      totalViews: 0,
      publishedArticles: 0,
      draftArticles: 0,
      cancelledArticles: 0,
    };
  }
};

export const getUserStats = async (authorId: string): Promise<UserStats> => {
  try {
    const { data: articles, error } = await supabase
      .from("articles")
      .select("status, views")
      .eq("author_id", authorId);

    if (error) {
      console.error("Error fetching user articles:", error);
      return {
        totalArticles: 0,
        totalComments: 0,
        totalViews: 0,
        publishedArticles: 0,
        draftArticles: 0,
        cancelledArticles: 0,
      };
    }

    const totalArticles = articles?.length || 0;
    const publishedArticles =
      articles?.filter((a) => a.status === "published").length || 0;
    const draftArticles =
      articles?.filter((a) => a.status === "draft").length || 0;
    const cancelledArticles =
      articles?.filter((a) => a.status === "cancelled").length || 0;
    const totalViews =
      articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id")
      .eq("author_id", authorId);

    const totalComments = comments?.length || 0;

    return {
      totalArticles,
      totalComments,
      totalViews,
      publishedArticles,
      draftArticles,
      cancelledArticles,
    };
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return {
      totalArticles: 0,
      totalComments: 0,
      totalViews: 0,
      publishedArticles: 0,
      draftArticles: 0,
      cancelledArticles: 0,
    };
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
    const { data, error } = await supabase
      .from("article_contributors")
      .select("article_id")
      .eq("author_id", userId)
      .neq("contribution_type", "owner");

    if (error) {
      console.error("Error fetching contributed articles:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const articleIds = data.map((d) => d.article_id);

    const { data: articles, error: articlesError } = await supabase
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

export const getUserOwnArticles = async (
  userId: string,
  limit = 10,
): Promise<JoinedArticle[]> => {
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
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching user articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getAuthorInfo = async (
  authorId: string,
): Promise<{ created_at: string; name: string } | null> => {
  try {
    const { data, error } = await supabase
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

// Article Feedback
export const getArticleFeedback = async (
  articleId: string,
): Promise<ArticleFeedback[]> => {
  try {
    const { data, error } = await supabase
      .from("article_feedback")
      .select(
        `
        *,
        author:authors!author_id (name, image_url)
      `,
      )
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching article feedback:", error);
      return [];
    }

    return data as unknown as ArticleFeedback[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createFeedback = async (
  articleId: string,
  authorId: string,
  feedbackContent: string,
  aiGenerated: boolean = false,
): Promise<ArticleFeedback | null> => {
  try {
    const { data, error } = await supabase
      .from("article_feedback")
      .insert({
        article_id: articleId,
        author_id: authorId,
        feedback_content: feedbackContent,
        resolved: false,
        ai_generated: aiGenerated,
      })
      .select(
        `
        *,
        author:authors!author_id (name, image_url)
      `,
      )
      .single();

    if (error) {
      console.error("Error creating feedback:", error);
      return null;
    }

    return data as unknown as ArticleFeedback;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const resolveFeedback = async (feedbackId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("article_feedback")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", feedbackId);

    if (error) {
      console.error("Error resolving feedback:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getUnresolvedFeedbackCount = async (
  articleId: string,
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("article_feedback")
      .select("id", { count: "exact" })
      .eq("article_id", articleId)
      .eq("resolved", false);

    if (error) {
      console.error("Error counting unresolved feedback:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};

export const getArticleContributors = async (articleId: string): Promise<ArticleContributor[]> => {
  try {
    const { data, error } = await supabase
      .from("article_contributors")
      .select(`
        *,
        author:authors!author_id (name, image_url)
      `)
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });

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
  contributionType: "owner" | "contributor" = "contributor"
): Promise<ArticleContributor | null> => {
  try {
    const { data, error } = await supabase
      .from("article_contributors")
      .insert({
        article_id: articleId,
        author_id: authorId,
        contribution_type: contributionType,
      })
      .select(`
        *,
        author:authors!author_id (name, image_url)
      `)
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

export const removeContributor = async (contributorId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
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
  newAuthorId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
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

export const getAllAuthors = async (): Promise<{ id: string; name: string; image_url: string | null }[]> => {
  try {
    const { data, error } = await supabase
      .from("authors")
      .select("id, name, image_url")
      .eq("role", "author")
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

export const getArticlesWithPendingFeedback = async (): Promise<JoinedArticle[]> => {
  try {
    const { data: articlesWithFeedback, error: feedbackError } = await supabase
      .from("article_feedback")
      .select("article_id")
      .eq("resolved", false);

    if (feedbackError) {
      console.error("Error fetching pending feedback:", feedbackError);
      return [];
    }

    if (!articlesWithFeedback || articlesWithFeedback.length === 0) {
      return [];
    }

    const articleIds = [...new Set(articlesWithFeedback.map(f => f.article_id))];

    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `)
      .in("id", articleIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles with pending feedback:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getArticlesWithPendingFeedbackUser = async (userId: string, isAdmin: boolean): Promise<JoinedArticle[]> => {
  try {
    let articleIdsQuery;
    
    if (isAdmin) {
      const { data: allFeedback } = await supabase
        .from("article_feedback")
        .select("article_id")
        .eq("resolved", false);
      
      if (!allFeedback || allFeedback.length === 0) return [];
      articleIdsQuery = [...new Set(allFeedback.map(f => f.article_id))];
    } else {
      const { data: userFeedback } = await supabase
        .from("article_feedback")
        .select("article_id")
        .eq("resolved", false);
      
      if (!userFeedback || userFeedback.length === 0) return [];
      const articleIds = [...new Set(userFeedback.map(f => f.article_id))];
      
      if (articleIds.length === 0) return [];
      
      const { data: userArticles } = await supabase
        .from("articles")
        .select("id")
        .eq("author_id", userId);
      
      if (!userArticles) return [];
      const ownedArticleIds = userArticles.map(a => a.id);
      articleIdsQuery = articleIds.filter((id: string) => ownedArticleIds.includes(id));
    }

    if (!articleIdsQuery || articleIdsQuery.length === 0) return [];

    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
        category:categories (id, name)
      `)
      .in("id", articleIdsQuery)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles with pending feedback:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getUnresolvedFeedbackCountByArticle = async (articleId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("article_feedback")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("resolved", false);

    if (error) {
      console.error("Error counting unresolved feedback:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};
