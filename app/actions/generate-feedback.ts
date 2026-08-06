"use server";

import { createFeedback, getArticleById } from "@/supabase/CRUD/queries";
import { revalidatePath } from "next/cache";
import { blocksToHtml } from "@/lib/content-parser";
import { Block } from "@/types/article";
import { checkAuthStatusServer, requireAuthor } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

export async function generateAIFeedback(articleId: string, authorId: string) {
  const auth = await checkAuthStatusServer();
  requireAuthor(auth);

  const article = await getArticleById(articleId);

  if (!article) {
    throw new Error("Article not found");
  }

  // Use blocks with asset URLs if available, otherwise fall back to content
  let articleContent = '';
  if (article.blocks && Array.isArray(article.blocks) && article.blocks.length > 0) {
    const assetUrlMap = (article as any).assetUrlMap || {};
    articleContent = blocksToHtml(article.blocks as Block[], assetUrlMap);
  } else {
    articleContent = article.content || '';
  }

  try {
    const res = await fetch(`${AI_WORKER_URL}/api/ai/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        title: article.title,
        content: articleContent.substring(0, 5000),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !Array.isArray(data.feedback)) {
      throw new Error(data.error || "Invalid response from AI");
    }

    const feedbackPoints = data.feedback.slice(0, 5);

    const results = [];
    for (const feedback of feedbackPoints as string[]) {
      const content = feedback.replace(/^-\s*/, "").trim();
      if (content.length > 10) {
        const result = await createFeedback(articleId, authorId, content, true);
        results.push(result);
      }
    }

    revalidatePath(`/edit/${articleId}`);
    return results;
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    throw error;
  }
}
