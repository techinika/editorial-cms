import { supabaseAdminClient } from "../supabase";

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
    const { data: articles, error } = await supabaseAdminClient
      .from("articles")
      .select("status, views, author_id");

    if (error) {
      console.error("Error fetching all articles:", error);
      return getEmptyStats();
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

    const { data: comments } = await supabaseAdminClient
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
    return getEmptyStats();
  }
};

export const getUserStats = async (authorId: string): Promise<UserStats> => {
  try {
    const { data: articles, error } = await supabaseAdminClient
      .from("articles")
      .select("status, views")
      .eq("author_id", authorId);

    if (error) {
      console.error("Error fetching user articles:", error);
      return getEmptyStats();
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

    return {
      totalArticles,
      totalComments: 0,
      totalViews,
      publishedArticles,
      draftArticles,
      cancelledArticles,
    };
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return getEmptyStats();
  }
};

const getEmptyStats = (): UserStats => ({
  totalArticles: 0,
  totalComments: 0,
  totalViews: 0,
  publishedArticles: 0,
  draftArticles: 0,
  cancelledArticles: 0,
});
