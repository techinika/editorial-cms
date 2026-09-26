import { NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

/**
 * Regenerates just the SEO pair — the summary (which doubles as the meta
 * description) and the tags — from the title and description already in the
 * form. Separate from generate-details so an editor can re-roll the SEO after
 * rewriting the copy by hand, without having to re-roll the whole description
 * and lose their edits.
 */
export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAuthorizedEditor(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description = "", tags = "" } = await request.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "A title is required" }, { status: 400 });
    }

    // The ai-worker's /api/ai/seo rejects an empty `content`, and it only reads
    // the first 8000 characters, so send the description and fall back to the
    // title so the button still does something useful on a bare form.
    const content =
      typeof description === "string" && description.trim()
        ? description.trim()
        : title.trim();

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/seo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({ title: title.trim(), content }),
    });

    const aiData = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok || typeof aiData.tags !== "string" || typeof aiData.description !== "string") {
      return NextResponse.json(
        { error: aiData?.error || "Failed to generate SEO metadata" },
        { status: aiRes.ok ? 500 : aiRes.status }
      );
    }

    return NextResponse.json({
      // summary === the SEO meta description, capped to the 160 characters the
      // worker already promises.
      summary: aiData.description.trim().slice(0, 160),
      tags: aiData.tags.trim(),
    });
  } catch (error) {
    console.error("Failed to generate video SEO metadata:", error);
    return NextResponse.json(
      { error: "Failed to generate SEO metadata" },
      { status: 500 }
    );
  }
}
