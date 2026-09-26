import type { VideoProvider, VideoStatus } from "@/types/video";

/**
 * Strips anything but a bare id out of whatever the editor pasted, so both
 * `https://youtu.be/dQw4w9WgXcQ?t=42` and a raw `dQw4w9WgXcQ` normalise to the
 * same id. Returns null when the input has no recognisable id.
 *
 * This is deliberately the same parser techinika-tv uses in
 * `src/lib/video.ts`. The public site re-parses `provider_id` at render time,
 * so the two copies have to agree on what a valid id looks like — a divergence
 * here shows up as a video that saves fine and then renders as a poster with no
 * player.
 */
export function extractProviderId(
  raw: string,
  provider: VideoProvider,
): string | null {
  const value = (raw || "").trim();
  if (!value) return null;

  if (provider === "youtube") {
    // Bare id: 11 chars from the YouTube alphabet. Reject the shorter Vimeo-style
    // numeric ids so a Vimeo link pasted into a YouTube field doesn't half-work.
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      const host = url.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        const id = url.pathname.slice(1).split("/")[0];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }

      if (
        host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "youtube-nocookie.com"
      ) {
        const v = url.searchParams.get("v");
        if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

        const segments = url.pathname.split("/").filter(Boolean);
        const markerIndex = segments.findIndex(
          (s) => s === "embed" || s === "shorts" || s === "live" || s === "v",
        );
        if (markerIndex !== -1 && segments[markerIndex + 1]) {
          const id = segments[markerIndex + 1];
          if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // vimeo — numeric id, optionally with a private hash segment
  if (/^\d+$/.test(value)) return value;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");
    if (
      host !== "vimeo.com" &&
      host !== "player.vimeo.com" &&
      !host.endsWith(".vimeo.com")
    ) {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments.find((s) => /^\d+$/.test(s));
    return id ?? null;
  } catch {
    return null;
  }
}

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    // strip combining marks so "Café" becomes "cafe" rather than "caf"
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "1:02:03" / "12:34" — matches the watch page's duration formatting. */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function parseDurationToSeconds(value: string): number | null {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  if (parts.length > 3) return null;

  return parts.reduce((acc, part) => acc * 60 + Number(part), 0);
}

/**
 * A video is only live once it is published *and* its publish time has passed.
 * Mirrors the RLS predicate on techinika-tv (`status = 'published' and
 * published_at <= now()`) so the CMS never shows a green "Live" badge for a
 * video the public site is still hiding.
 */
export function isLive(
  status: VideoStatus,
  publishedAt: string | null,
  now: Date = new Date(),
): boolean {
  if (status !== "published") return false;
  if (!publishedAt) return true;
  const ts = Date.parse(publishedAt);
  return Number.isNaN(ts) ? false : ts <= now.getTime();
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
