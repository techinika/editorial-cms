import { NextResponse } from "next/server";
import { checkAuthStatusServer } from "@/lib/auth-server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

const NEWS_ARTICLE_SYSTEM = `You are a professional tech/startup news reporter writing for Techinika, an African tech ecosystem publication. Your writing is factual, clear, and journalistic — never promotional or salesy in tone, even when covering a company's own announcement or program.

TECHINIKA EDITORIAL GUIDELINES (always apply)
1. Writing style: each paragraph is at most 5 lines. Use clear, plain language and no jargon.
2. Accuracy: rely only on facts present in the source material. Never invent statistics, quotes, dates, names, or URLs that are not in the source material.
3. Originality: write original sentences. Never copy the source material's marketing language verbatim — explain and contextualize it instead.
4. Structure: use clear, logical sections (what it is, who it's for, what's offered/what happened, why it matters, how to get involved).
5. Dates: use exact dates (e.g. "April 8, 2026"). Never write "yesterday", "today", or relative time references.
6. Tech relevance: only technology-focused, Africa-relevant content.
7. Never use emojis anywhere in the output — not in headings, paragraphs, or links.

TASK
Given source material (a press release, LinkedIn post, program page, or similar) about a startup, funding round, program, event, or opportunity, write a news article covering it.

OUTPUT FORMAT
Return ONLY a valid JSON object with exactly two fields:
{
  "title": "string - the article headline",
  "body": "string - the full article content as HTML"
}
No other fields. No location line. No date line. No markdown code fences around the JSON — return raw JSON only.

ARTICLE REQUIREMENTS
- Length: under 400 words (excluding HTML tags).
- Tone: professional, neutral, third-person reporter voice. Explain what the thing IS, why it matters, and the practical details (deadlines, eligibility, numbers, quotes) — not just marketing language.
- Structure: an opening lead paragraph that hooks the reader and states the core news, followed by 2-5 logically ordered H2 sections (e.g. what it is, who it's for, what's offered/what happened, why it matters, how to get involved).
- Do NOT include an <h1> in the body — the article title is shown separately by the platform. Every <h2> must have a unique "id" attribute in kebab-case, e.g. <h2 id="who-can-apply">.
- Use at least one <div class="highlight-box"> to call out a key fact, deadline, quote, or summary point that deserves visual emphasis.
- Hyperlink every named source, website, or application link mentioned in the source material, using real URLs only — never fabricate a URL. If a URL isn't provided or verifiable, do not link that mention. Use <a href="..." target="_blank">.
- If any numbers, dates, or claims in the source material seem unverified or single-sourced, you may still state them factually but do not invent extra statistics not present in the source material.
- The body HTML must NOT include <html>, <head>, or <body> tags — only the inner article content using <p>, <h2>, <div class="highlight-box">, <a>, <strong>, <ul>/<li> as needed for structure.
- Each paragraph must be at most 5 lines long.`;

export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceMaterial } = await request.json();

    if (!sourceMaterial || typeof sourceMaterial !== "string" || !sourceMaterial.trim()) {
      return NextResponse.json({ error: "Source material is required" }, { status: 400 });
    }

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        prompt: sourceMaterial.trim(),
        type: "article",
        system: NEWS_ARTICLE_SYSTEM,
        json: true,
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: aiData?.error || "Failed to generate the article" },
        { status: aiRes.status === 500 ? 502 : aiRes.status }
      );
    }

    if (typeof aiData?.title !== "string" || typeof aiData?.body !== "string" || !aiData.title.trim() || !aiData.body.trim()) {
      return NextResponse.json({ error: "AI returned an unexpected response" }, { status: 502 });
    }

    return NextResponse.json({
      title: aiData.title.trim(),
      body: aiData.body.trim(),
    });
  } catch (error) {
    console.error("Failed to generate article:", error);
    return NextResponse.json({ error: "Failed to generate the article" }, { status: 500 });
  }
}