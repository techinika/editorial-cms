import { getSupabase } from "../supabase";

export interface UserStats {
  totalArticles: number;
  totalComments: number;
  totalViews: number;
  publishedArticles: number;
  draftArticles: number;
  cancelledArticles: number;
}

export interface PeriodStat {
  period: string;
  articleCount: number;
  totalViews: number;
}

const getEmptyStats = (): UserStats => ({
  totalArticles: 0,
  totalComments: 0,
  totalViews: 0,
  publishedArticles: 0,
  draftArticles: 0,
  cancelledArticles: 0,
});

export const getAllStats = async (): Promise<UserStats> => {
  try {
    const [articlesResult, commentsResult] = await Promise.all([
      getSupabase()
        .from("articles")
        .select("status, views", { count: "exact" }),
      getSupabase()
        .from("comments")
        .select("id", { count: "exact", head: true }),
    ]);

    if (articlesResult.error) return getEmptyStats();

    const articles = articlesResult.data || [];
    const totalArticles = articles.length;
    const publishedArticles = articles.filter((a) => a.status === "published").length;
    const draftArticles = articles.filter((a) => a.status === "draft").length;
    const cancelledArticles = articles.filter((a) => a.status === "cancelled").length;
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalComments = commentsResult.count || 0;

    return { totalArticles, totalComments, totalViews, publishedArticles, draftArticles, cancelledArticles };
  } catch (err) {
    console.error("Error fetching all stats:", err);
    return getEmptyStats();
  }
};

export const getUserStats = async (authorId: string): Promise<UserStats> => {
  try {
    const { data: articles, error } = await getSupabase()
      .from("articles")
      .select("status, views")
      .eq("author_id", authorId);

    if (error) return getEmptyStats();

    const totalArticles = articles?.length || 0;
    const publishedArticles = articles?.filter((a) => a.status === "published").length || 0;
    const draftArticles = articles?.filter((a) => a.status === "draft").length || 0;
    const cancelledArticles = articles?.filter((a) => a.status === "cancelled").length || 0;
    const totalViews = articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

    return { totalArticles, totalComments: 0, totalViews, publishedArticles, draftArticles, cancelledArticles };
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return getEmptyStats();
  }
};

export const getArticleCountByPeriod = async (
  authorId: string | null,
  period: "day" | "week" | "month",
): Promise<PeriodStat[]> => {
  try {
    let query = getSupabase()
      .from("articles")
      .select("created_at, views")
      .eq("status", "published");

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    const { data: articles, error } = await query;
    if (error || !articles) return [];

    const truncateFn = (date: Date): string => {
      const d = new Date(date);
      if (period === "day") {
        return d.toISOString().split("T")[0];
      } else if (period === "week") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        return startOfWeek.toISOString().split("T")[0];
      } else {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    };

    const grouped: Record<string, { articleCount: number; totalViews: number }> = {};
    for (const article of articles) {
      const key = truncateFn(new Date(article.created_at));
      if (!grouped[key]) grouped[key] = { articleCount: 0, totalViews: 0 };
      grouped[key].articleCount += 1;
      grouped[key].totalViews += article.views || 0;
    }

    return Object.entries(grouped)
      .map(([period_key, data]) => ({ period: period_key, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch (err) {
    console.error("Error fetching period stats:", err);
    return [];
  }
};
