import type { VideoInput, VideoProvider } from "@/types/video";
import { extractProviderId, parseDurationToSeconds, autoSlug } from "@/lib/video";

/**
 * Validation and normalisation for video writes.
 *
 * Kept out of the route handlers so the same rules apply no matter which entry
 * point writes a video, and so the rules are unit-testable without a request.
 *
 * status and published_at are *not* handled here — the caller sets both from
 * the `intent` the save button sent, via resolvePublishState().
 */

const PROVIDERS: VideoProvider[] = ["youtube", "vimeo"];

export type FieldErrors = Record<string, string>;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

/**
 * Returns the cleaned row plus per-field errors. `partial` is for PATCH, where
 * only the provided keys are validated and omitted keys are left alone.
 */
export function validateVideoInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): { valid: boolean; errors: FieldErrors; value: Partial<VideoInput> } {
  const errors: FieldErrors = {};
  const value: Partial<VideoInput> = {};

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: { _: "Expected a JSON object" }, value };
  }
  const input = body as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);

  // ── title ────────────────────────────────────────────────────────────────
  if (!partial || has("title")) {
    if (!isNonEmptyString(input.title)) {
      errors.title = "Title is required";
    } else if (input.title.trim().length > 300) {
      errors.title = "Title must be 300 characters or fewer";
    } else {
      value.title = input.title.trim();
    }
  }

  // ── slug ─────────────────────────────────────────────────────────────────
  // Derived from the title when the client didn't send one, so an editor never
  // has to think about slugs. An explicit slug is still honoured (the form
  // exposes it for the rare hand-tuned case) but must be well-formed.
  if (!partial || has("slug")) {
    if (!isNonEmptyString(input.slug)) {
      if (isNonEmptyString(value.title ?? input.title)) {
        value.slug = autoSlug(String(value.title ?? input.title));
      } else {
        errors.slug = "Slug is required";
      }
    } else {
      const slug = input.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        errors.slug =
          "Use lowercase letters, numbers and single hyphens (e.g. founders-interview)";
      } else if (slug.length > 80) {
        errors.slug = "Slug must be 80 characters or fewer";
      } else {
        value.slug = slug;
      }
    }
  }

  // ── summary ──────────────────────────────────────────────────────────────
  if (!partial || has("summary")) {
    if (!isNonEmptyString(input.summary)) {
      errors.summary = "Summary is required";
    } else {
      value.summary = input.summary.trim();
    }
  }

  // ── provider + provider_id ───────────────────────────────────────────────
  const providerGiven = !partial || has("provider");
  const providerIdGiven = !partial || has("provider_id");

  if (providerGiven) {
    if (!PROVIDERS.includes(input.provider as VideoProvider)) {
      errors.provider = "Provider must be youtube or vimeo";
    } else {
      value.provider = input.provider as VideoProvider;
    }
  }

  if (providerIdGiven) {
    // Resolve against whichever provider is in play: the submitted one, or the
    // effective one on a PATCH where only the URL changed.
    const effective =
      (value.provider as VideoProvider | undefined) ??
      (input.provider as VideoProvider | undefined) ??
      "youtube";

    if (!isNonEmptyString(input.provider_id)) {
      errors.provider_id = "A video URL or ID is required";
    } else {
      const id = extractProviderId(input.provider_id, effective);
      if (!id) {
        errors.provider_id =
          effective === "youtube"
            ? "Not a recognisable YouTube URL or video ID"
            : "Not a recognisable Vimeo URL or video ID";
      } else {
        // Store the bare id, never the pasted URL: the watch page rebuilds the
        // embed URL itself, and storing full URLs is how you end up with
        // tracking params (t=, si=, feature=) baked into provider_id.
        value.provider_id = id;
      }
    }
  }

  // ── category_id ──────────────────────────────────────────────────────────
  if (!partial || has("category_id")) {
    if (!isNonEmptyString(input.category_id)) {
      errors.category_id = "Pick a series";
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.category_id.trim())) {
      errors.category_id = "Invalid series id";
    } else {
      value.category_id = input.category_id.trim();
    }
  }

  // ── status / published_at ────────────────────────────────────────────────
  // Deliberately absent. Both are decided server-side from the `intent` the
  // button sent (see resolvePublishState), so a hand-crafted request cannot
  // publish a video, back-date it, or leave a draft carrying a live timestamp.

  // ── optional text ────────────────────────────────────────────────────────
  for (const field of [
    "description",
    "companion_article_slug",
    "thumbnail",
    "tags",
    "notice",
  ] as const) {
    if (has(field)) {
      const raw = input[field];
      if (raw === null || raw === undefined || raw === "") {
        value[field] = null;
      } else if (typeof raw === "string") {
        value[field] = raw.trim() || null;
      }
    }
  }

  if (
    value.companion_article_slug &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.companion_article_slug)
  ) {
    errors.companion_article_slug =
      "Use the article slug, lowercase with hyphens";
  }

  // ── duration ─────────────────────────────────────────────────────────────
  if (has("duration")) {
    const seconds = parseDurationToSeconds(String(input.duration ?? ""));
    if (seconds === null) {
      errors.duration = "Use seconds (2700) or mm:ss / hh:mm:ss";
    } else if (seconds < 0) {
      errors.duration = "Duration cannot be negative";
    } else {
      value.duration = seconds;
    }
  }

  // ── timestamps ───────────────────────────────────────────────────────────
  // `scheduled_at` is an editorial marker only. The public site gates on
  // published_at, which this layer never accepts from the client.
  const scheduledAt = toIsoOrNull(input.scheduled_at);

  if (has("scheduled_at") && input.scheduled_at && scheduledAt === null) {
    errors.scheduled_at = "Not a valid date";
  } else if (has("scheduled_at")) {
    value.scheduled_at = scheduledAt;
  }

  // ── is_featured ──────────────────────────────────────────────────────────
  if (has("is_featured")) {
    if (typeof input.is_featured !== "boolean") {
      errors.is_featured = "Must be true or false";
    } else {
      value.is_featured = input.is_featured;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

/** Convenience wrapper: validate and return the cleaned row or the errors. */
export function normaliseVideoInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): VideoInput {
  const { value } = validateVideoInput(body, { partial });
  return value as VideoInput;
}
