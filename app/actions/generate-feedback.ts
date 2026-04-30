"use server";

import puter from "@heyputer/puter.js";
import { createFeedback, getArticleById } from "@/supabase/CRUD/querries";
import { revalidatePath } from "next/cache";
import { blocksToHtml } from "@/lib/content-parser";
import { Block } from "@/types/article";

export async function generateAIFeedback(articleId: string, authorId: string) {
  const puterAuthToken = process.env.PUTER_AUTH_TOKEN;
  
  if (!puterAuthToken) {
    throw new Error("Puter AI not configured");
  }

  puter.setAuthToken(puterAuthToken);

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

  const prompt = `You are an expert article reviewer. Analyze the following article and provide 5 constructive feedback points that would help improve it. Each feedback should be specific, actionable, and helpful.

Article Title: ${article.title}
Article Content: ${articleContent.substring(0, 5000)}

Provide 5 feedback points, one per line, each starting with a bullet point (-). Each feedback should be 1-2 sentences maximum and focused on:
- Content quality and clarity
- Structure and organization  
- Grammar and readability
- Missing information or gaps
- Overall improvement suggestions`;

  try {
    const response = await puter.ai.chat(prompt, {
      model: "gpt-4.1-nano"
    });

    if (!response || typeof response !== 'string') {
      throw new Error("Invalid response from AI");
    }

    const feedbackPoints = response
      .split("\n")
      .filter((line: string) => line.trim().startsWith("-"))
      .slice(0, 5);

    const results = [];
    for (const feedback of feedbackPoints) {
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