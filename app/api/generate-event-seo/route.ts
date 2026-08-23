import { NextResponse } from "next/server";
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

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/seo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({ title, content }),
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
    console.error("Failed to generate event SEO metadata:", error);
    return NextResponse.json({ error: "Failed to generate SEO metadata" }, { status: 500 });
  }
}
