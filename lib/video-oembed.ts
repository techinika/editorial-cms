import type { VideoProvider } from "@/types/video";

/**
 * Public oEmbed metadata for a YouTube or Vimeo video.
 *
 * Why this exists: the AI worker has no way to watch a video, so asking it to
 * "generate details for this URL" with nothing but the URL produces confident
 * fiction. oEmbed is a public, key-less endpoint that returns the video's real
 * title, channel and thumbnail, which is enough to ground the generation in
 * something true. Vimeo's response also carries a duration, so the form can be
 * pre-filled with a real runtime instead of a guess.
 *
 * Server-side only (it makes outbound requests), and never fatal: every caller
 * must work when this returns null.
 */
export interface VideoOEmbed {
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  /** Seconds, only when the provider reports it (Vimeo does, YouTube doesn't). */
  duration: number | null;
}

const TIMEOUT_MS = 6000;

function watchUrl(provider: VideoProvider, id: string): string {
  return provider === "youtube"
    ? `https://www.youtube.com/watch?v=${id}`
    : `https://vimeo.com/${id}`;
}

export async function fetchVideoOEmbed(
  provider: VideoProvider,
  providerId: string,
): Promise<VideoOEmbed | null> {
  if (!providerId) return null;

  const endpoint =
    provider === "youtube"
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(
          watchUrl(provider, providerId),
        )}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
          watchUrl(provider, providerId),
        )}`;

  try {
    const res = await fetch(endpoint, {
      // oEmbed responses are public and cacheable; a short cache keeps us from
      // hammering the provider when an editor regenerates metadata repeatedly.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const duration =
      typeof json.duration === "number" && json.duration > 0
        ? Math.round(json.duration)
        : null;

    const result: VideoOEmbed = {
      title: str(json.title),
      author: str(json.author_name),
      thumbnail: str(json.thumbnail_url),
      duration,
    };

    // Nothing useful came back — treat it as "no metadata" so the caller falls
    // back to the editor's own notes rather than showing an empty form.
    if (!result.title && !result.author) return null;
    return result;
  } catch {
    // Offline, blocked, rate-limited or slow: metadata is an enhancement, not a
    // prerequisite, so swallow it.
    return null;
  }
}

/** One-line, factual grounding string for the AI prompt. */
export function describeOEmbed(meta: VideoOEmbed | null): string {
  if (!meta) return "";
  const parts: string[] = [];
  if (meta.title) parts.push(`Video title as published by the channel: "${meta.title}"`);
  if (meta.author) parts.push(`Channel / uploader: ${meta.author}`);
  if (meta.duration) {
    const m = Math.floor(meta.duration / 60);
    const s = meta.duration % 60;
    parts.push(`Runtime: ${m}m ${s}s`);
  }
  return parts.join("\n");
}
