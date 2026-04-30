import { Comment, ArticlePendingActivity } from "@/types/article";
import { supabaseAdminClient } from "../supabase";
import { getUnresolvedFeedbackCountByArticle } from "./feedback";

export const getArticleComments = async (
  articleId: string,
): Promise<Comment[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("comments")
      .select(
        `
        *,
        user:users!user_id (id, nickname)
      `,
      )
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return data as unknown as Comment[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getAllComments = async (): Promise<Comment[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("comments")
      .select(
        `
        *,
        user:users!user_id (id, nickname),
        article:articles!article_id (id, title, slug)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all comments:", error);
      return [];
    }

    return data as unknown as Comment[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getUserComments = async (userId: string): Promise<Comment[]> => {
  try {
    const { data: userArticles } = await supabaseAdminClient
      .from("articles")
      .select("id")
      .eq("author_id", userId);

    if (!userArticles || userArticles.length === 0) {
      return [];
    }

    const articleIds = userArticles.map((a) => a.id);

    const { data, error } = await supabaseAdminClient
      .from("comments")
      .select(
        `
        *,
        user:users!user_id (id, nickname),
        article:articles!article_id (id, title, slug)
      `,
      )
      .in("article_id", articleIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user comments:", error);
      return [];
    }

    return data as unknown as Comment[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createComment = async (
  articleId: string,
  userId: string,
  message: string,
): Promise<Comment | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("comments")
      .insert({
        article_id: articleId,
        user_id: userId,
        message,
        status: "published",
        read: false,
      })
      .select(
        `
        *,
        user:users!user_id (id, nickname),
        article:articles!article_id (id, title, slug)
      `,
      )
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return null;
    }

    return data as unknown as Comment;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const markCommentAsRead = async (
  commentId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("comments")
      .update({ read: true })
      .eq("id", commentId);

    if (error) {
      console.error("Error marking comment as read:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const markAllCommentsAsReadByArticle = async (
  articleId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("comments")
      .update({ read: true })
      .eq("article_id", articleId)
      .eq("read", false);

    if (error) {
      console.error("Error marking comments as read:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getUnreadCommentsCountByArticle = async (
  articleId: string,
): Promise<number> => {
  try {
    const { count, error } = await supabaseAdminClient
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("read", false);

    if (error) {
      console.error("Error counting unread comments:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};

export const getPendingActivityByArticle = async (
  articleId: string,
): Promise<ArticlePendingActivity> => {
  try {
    const [unresolvedFeedback, unreadComments] = await Promise.all([
      getUnresolvedFeedbackCountByArticle(articleId),
      getUnreadCommentsCountByArticle(articleId),
    ]);

    return {
      articleId,
      unresolvedFeedback,
      unreadComments,
    };
  } catch (err) {
    console.error("Error getting pending activity:", err);
    return { articleId, unresolvedFeedback: 0, unreadComments: 0 };
  }
};

export const getAllPendingActivity = async (): Promise<
  ArticlePendingActivity[]
> => {
  try {
    const { data: feedbackData, error: feedbackError } = await supabaseAdminClient
      .from("article_feedback")
      .select("article_id")
      .eq("resolved", false);

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
    }

    const { data: commentsData, error: commentsError } = await supabaseAdminClient
      .from("comments")
      .select("article_id")
      .eq("read", false);

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    const activityMap = new Map<string, ArticlePendingActivity>();

    if (feedbackData) {
      for (const f of feedbackData) {
        const existing = activityMap.get(f.article_id);
        if (existing) {
          existing.unresolvedFeedback += 1;
        } else {
          activityMap.set(f.article_id, {
            articleId: f.article_id,
            unresolvedFeedback: 1,
            unreadComments: 0,
          });
        }
      }
    }

    if (commentsData) {
      for (const c of commentsData) {
        const existing = activityMap.get(c.article_id);
        if (existing) {
          existing.unreadComments += 1;
        } else {
          activityMap.set(c.article_id, {
            articleId: c.article_id,
            unresolvedFeedback: 0,
            unreadComments: 1,
          });
        }
      }
    }

    return Array.from(activityMap.values());
  } catch (err) {
    console.error("Error getting all pending activity:", err);
    return [];
  }
};
