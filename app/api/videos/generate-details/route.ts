import { NextResponse } from "next/server";
import { checkAuthStatusServer, isAuthorizedEditor } from "@/lib/auth-server";
import { extractProviderId } from "@/lib/video";
import type { VideoProvider } from "@/types/video";
import { fetchVideoOEmbed, describeOEmbed } from "@/lib/video-oembed";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

const VIDEO_DETAILS_SYSTEM = `You are a video editor for Techinika TV, the video arm of Techinika, an African tech ecosystem publication. You write the metadata that appears around a video: its headline, the card summary, the watch-page description and its search tags.

TECHINIKA EDITORIAL GUIDELINES (always apply)
1. Accuracy: you are describing a specific video that has already been recorded. Rely only on the source material you are given — the video's own title, the channel, and any notes from the editor. NEVER invent a speaker's name, a company, a statistic, a date, a funding round or a claim that is not in that material. If you do not know what a video is about beyond its title, write conservatively and describe only what the title supports.
2. Tone: professional and factual, never promotional or salesy. No "amazing", "inspiring", "game-changing" or similar marketing language.
3. No emojis anywhere in the output — not in the title, summary, description or tags.
4. Plain language, no jargon, and never assume the reader has watched the video.
5. Write in the third person. Do not address the reader as "you".

OUTPUT FORMAT
Return ONLY a valid JSON object with exactly these four fields, no others:
{
  "title": "string - the video headline",
  "summary": "string - the SEO meta description AND the card summary, at most 160 characters",
  "description": "string - 2-4 sentences of plain text for the watch page",
  "tags": "string - 5-8 relevant keywords, comma separated, no '#' symbols"
}
No markdown code fences. Return raw JSON only.

FIELD REQUIREMENTS
- title: clear and specific, under 120 characters. Do not add "|" or the channel name to the end.
- summary: this is the SEO meta description, so it must be a complete, standalone sentence of at most 160 characters that would make someone click. Do not pad it and do not truncate mid-word.
- description: longer than the summary, may be 2-4 sentences. Plain text only — no HTML tags, no markdown, no bullet points.
- tags: lowercase keywords separated by ", ". Technology and Africa-relevant terms where relevant.`;

export async function POST(request: Request) {
  try {
    const auth = await checkAuthStatusServer();
    if (!isAuthorizedEditor(auth)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider = "youtube",
      url,
      notes = "",
      existingTitle = "",
      existingDescription = "",
    } = body ?? {};

    if (provider !== "youtube" && provider !== "vimeo") {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const providerId = typeof url === "string" ? extractProviderId(url, provider) : null;
    if (!providerId) {
      return NextResponse.json(
        {
          error:
            provider === "youtube"
              ? "Paste a YouTube URL or video ID first"
              : "Paste a Vimeo URL or video ID first",
        },
        { status: 400 }
      );
    }

    // Ground the model in the video's real metadata. Without this it is
    // guessing at the subject from a bare URL.
    const meta = await fetchVideoOEmbed(provider as VideoProvider, providerId);
    const grounding = describeOEmbed(meta);

    const context = [
      grounding,
      typeof notes === "string" && notes.trim()
        ? `Notes from the editor about what this video covers:\n${notes.trim()}`
        : "",
      typeof existingTitle === "string" && existingTitle.trim()
        ? `Current title (improve or replace it): ${existingTitle.trim()}`
        : "",
      typeof existingDescription === "string" && existingDescription.trim()
        ? `Current description (improve or replace it):\n${existingDescription.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!context.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not read anything about this video from the provider. Paste the video URL again, or add a note describing what it covers.",
        },
        { status: 422 }
      );
    }

    const aiRes = await fetch(`${AI_WORKER_URL}/api/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify({
        prompt: `Write the metadata for this Techinika TV video.\n\n${context}`,
        type: "video",
        system: VIDEO_DETAILS_SYSTEM,
        json: true,
        temperature: 0.6,
      }),
    });

    const aiData = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: aiData?.error || "Failed to generate video details" },
        { status: aiRes.status === 500 ? 502 : aiRes.status }
      );
    }

    const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const title = text(aiData?.title);
    const summary = text(aiData?.summary).slice(0, 160);
    const description = text(aiData?.description);
    const tags = text(aiData?.tags);

    if (!title || !summary) {
      return NextResponse.json(
        { error: "AI returned an unexpected response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title,
      summary,
      description,
      tags,
      // Free win when the provider reports it (Vimeo only) — the editor would
      // otherwise have to type the runtime by hand.
      duration: meta?.duration ?? null,
      sourceTitle: meta?.title ?? null,
    });
  } catch (error) {
    console.error("Failed to generate video details:", error);
    return NextResponse.json(
      { error: "Failed to generate the video details" },
      { status: 500 }
    );
  }
}
