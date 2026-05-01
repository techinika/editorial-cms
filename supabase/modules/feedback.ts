import { ArticleFeedback } from "@/types/article";
import { supabaseAdminClient } from "../supabase";

export const getArticleFeedback = async (
  articleId: string,
): Promise<ArticleFeedback[]> => {
  try {
    const { data, error } = await supabaseAdminClient
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
    const { data, error } = await supabaseAdminClient
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
    const { error } = await supabaseAdminClient
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
    const { data, error } = await supabaseAdminClient
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

export const getUnresolvedFeedbackCountByArticle = async (
  articleId: string,
): Promise<number> => {
  try {
    const { count, error } = await supabaseAdminClient
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

export const getPendingFeedbackArticles = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("article_feedback")
      .select("article_id")
      .eq("resolved", false);

    if (error) {
      console.error("Error fetching pending feedback:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return Array.from(new Set(data.map((f) => f.article_id)));
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};
