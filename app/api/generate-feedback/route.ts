import { NextResponse } from "next/server";
import { createFeedback, getArticleById } from "@/supabase/CRUD/queries";
import { blocksToHtml } from "@/lib/content-parser";
import { Block } from "@/types/article";
import { checkAuthStatusServer } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, authorId } = await request.json();

    if (!articleId || !authorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await getArticleById(articleId);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const articleContent = article.blocks && Array.isArray(article.blocks) && article.blocks.length > 0
      ? blocksToHtml(article.blocks as Block[], (article as any).assetUrlMap)
      : article.content || 'No content';

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        title: article.title,
        content: articleContent,
      }),
    });

    const aiData = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok || !Array.isArray(aiData.feedback)) {
      return NextResponse.json(
        { error: aiData.error || "Failed to generate feedback" },
        { status: aiRes.ok ? 500 : aiRes.status }
      );
    }

    const results = [];
    for (const feedback of aiData.feedback as string[]) {
      const content = feedback.replace(/^[-.\d.]+\s*/, "").trim();
      if (content.length > 10 && content.length < 500) {
        const result = await createFeedback(articleId, authorId, content, true);
        if (result) {
          results.push(result);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to generate feedback:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
