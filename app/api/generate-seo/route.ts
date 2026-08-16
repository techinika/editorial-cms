import { NextResponse } from "next/server";
import { getArticleById } from "@/supabase/CRUD/queries";
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

    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await getArticleById(articleId);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const articleContent = article.blocks && Array.isArray(article.blocks) && article.blocks.length > 0
      ? blocksToHtml(article.blocks as Block[], (article as any).assetUrlMap)
      : article.content || 'No content';

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/seo`, {
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

    if (!aiRes.ok || typeof aiData.tags !== "string" || typeof aiData.description !== "string") {
      return NextResponse.json(
        { error: aiData.error || "Failed to generate SEO metadata" },
        { status: aiRes.ok ? 500 : aiRes.status }
      );
    }

    return NextResponse.json({ tags: aiData.tags, description: aiData.description });
  } catch (error) {
    console.error("Failed to generate SEO metadata:", error);
    return NextResponse.json({ error: "Failed to generate SEO metadata" }, { status: 500 });
  }
}
