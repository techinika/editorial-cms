import type { ArticleIdeaInput, ContentType, IdeaStatus } from "@/types/idea";
import { IDEA_STATUSES, safeHttpUrl } from "@/lib/idea";

/**
 * Validation for idea writes. Mirrors lib/video-validation.ts: same rules for
 * every entry point, testable without a request.
 */

export type FieldErrors = Record<string, string>;

const CONTENT_TYPES: ContentType[] = ["editorial", "commercial"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const isString = (v: unknown): v is string => typeof v === "string";

const trimmed = (v: unknown): string | null => {
  if (!isString(v)) return null;
  const t = v.trim();
  return t.length ? t : null;
};

/**
 * `partial` is for PATCH, where omitted keys are left alone. In that mode the
 * result is a Partial; for a create it is a full ArticleIdeaInput, because the
 * title check above guarantees one.
 */
export function validateIdeaInput<P extends boolean = false>(
  body: unknown,
  opts?: { partial?: P },
): {
  valid: boolean;
  errors: FieldErrors;
  value: P extends true ? Partial<ArticleIdeaInput> : ArticleIdeaInput;
} {
  const partial = opts?.partial === true;
  const errors: FieldErrors = {};
  const value: Partial<ArticleIdeaInput> = {};

  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Expected a JSON object" },
      value: value as P extends true ? Partial<ArticleIdeaInput> : ArticleIdeaInput,
    };
  }
  const input = body as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);

  // ── title ────────────────────────────────────────────────────────────────
  if (!partial || has("title")) {
    const title = trimmed(input.title);
    if (!title) {
      errors.title = "The idea needs a title";
    } else if (title.length > 300) {
      errors.title = "Keep the title under 300 characters";
    } else {
      value.title = title;
    }
  }

  // ── free text ────────────────────────────────────────────────────────────
  for (const field of [
    "lead_name",
    "contact_phone",
    "concept",
    "notes",
  ] as const) {
    if (has(field)) {
      const v = trimmed(input[field]);
      value[field] = v;
    }
  }

  if (value.lead_name && value.lead_name.length > 200) {
    errors.lead_name = "Keep the lead's name under 200 characters";
  }
  if (value.concept && value.concept.length > 8000) {
    errors.concept = "The brief is too long (8000 character limit)";
  }
  if (value.notes && value.notes.length > 8000) {
    errors.notes = "The notes are too long (8000 character limit)";
  }

  // ── contact_email ────────────────────────────────────────────────────────
  if (has("contact_email")) {
    const email = trimmed(input.contact_email);
    if (email && !EMAIL.test(email)) {
      errors.contact_email = "That does not look like an email address";
    } else {
      value.contact_email = email;
    }
  }

  // ── source_url ───────────────────────────────────────────────────────────
  // This is fed to /api/generate-article as source material, so a non-http
  // value would end up quoted back into an article body. Reject it here.
  if (has("source_url")) {
    const raw = trimmed(input.source_url);
    if (!raw) {
      value.source_url = null;
    } else {
      const safe = safeHttpUrl(raw);
      if (!safe) {
        errors.source_url = "Use a full http:// or https:// link";
      } else {
        value.source_url = safe;
      }
    }
  }

  // ── status ───────────────────────────────────────────────────────────────
  if (has("status")) {
    if (!IDEA_STATUSES.includes(input.status as IdeaStatus)) {
      errors.status = "Unknown pipeline stage";
    } else {
      value.status = input.status as IdeaStatus;
    }
  }

  // ── content_type ─────────────────────────────────────────────────────────
  if (has("content_type")) {
    if (!CONTENT_TYPES.includes(input.content_type as ContentType)) {
      errors.content_type = "Must be editorial or commercial";
    } else {
      value.content_type = input.content_type as ContentType;
    }
  }

  // ── foreign keys ─────────────────────────────────────────────────────────
  // null clears the assignment or partner; only accept null or a real uuid, so
  // a typo can't silently orphan the row.
  for (const field of ["assigned_author_id", "partner_id"] as const) {
    if (has(field)) {
      const v = input[field];
      if (v === null || v === undefined || v === "") {
        value[field] = null;
      } else if (isString(v) && UUID.test(v.trim())) {
        value[field] = v.trim();
      } else {
        errors[field] = "Invalid id";
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: value as P extends true ? Partial<ArticleIdeaInput> : ArticleIdeaInput,
  };
}

export const IDEA_ERRORS = {
  generic: { _: "Something went wrong" },
} as const;
