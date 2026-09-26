import type { PartnerInput } from "@/types/idea";
import { safeHttpUrl, slugify } from "@/lib/idea";

/**
 * Validation for partner writes. Mirrors lib/idea-validation.ts so both the
 * API and the form agree on what a valid partner is.
 */

export type FieldErrors = Record<string, string>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Mirrors the partners table's slug check constraint. */
const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isString = (v: unknown): v is string => typeof v === "string";

const trimmed = (v: unknown): string | null => {
  if (!isString(v)) return null;
  const t = v.trim();
  return t.length ? t : null;
};

/** As with ideas: a create yields a full PartnerInput, a PATCH a Partial. */
export function validatePartnerInput<P extends boolean = false>(
  body: unknown,
  opts?: { partial?: P },
): {
  valid: boolean;
  errors: FieldErrors;
  value: P extends true ? Partial<PartnerInput> : PartnerInput;
} {
  const partial = opts?.partial === true;
  const errors: FieldErrors = {};
  const value: Partial<PartnerInput> = {};

  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Expected a JSON object" },
      value: value as P extends true ? Partial<PartnerInput> : PartnerInput,
    };
  }
  const input = body as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);

  // ── name ─────────────────────────────────────────────────────────────────
  if (!partial || has("name")) {
    const name = trimmed(input.name);
    if (!name) {
      errors.name = "The partner needs a name";
    } else if (name.length > 200) {
      errors.name = "Keep the name under 200 characters";
    } else {
      value.name = name;
    }
  }

  // ── slug ─────────────────────────────────────────────────────────────────
  // Optional: derive it from the name so the editor doesn't have to think about
  // it. The table also enforces this format, and both the name and the slug
  // have case-insensitive unique indexes, so a duplicate is rejected by the
  // database even if two admins save the same name at once.
  if (has("slug") || (!partial && value.name)) {
    const raw = trimmed(input.slug);
    const slug = raw ? slugify(raw) : value.name ? slugify(value.name) : null;
    if (raw && !slug) {
      errors.slug = "The slug needs letters or numbers";
    } else if (slug && slug.length > 100) {
      errors.slug = "Keep the slug under 100 characters";
    } else if (slug) {
      value.slug = slug;
    }
  }
  if (value.slug && !SLUG_FORMAT.test(value.slug)) {
    errors.slug = "Use lowercase letters, numbers and single dashes";
  }

  for (const field of [
    "description",
    "contact_name",
    "notes",
  ] as const) {
    if (has(field)) {
      value[field] = trimmed(input[field]);
    }
  }
  if (value.description && value.description.length > 2000) {
    errors.description = "Keep the description under 2000 characters";
  }
  if (value.notes && value.notes.length > 4000) {
    errors.notes = "Keep the notes under 4000 characters";
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

  // ── website / logo_url ───────────────────────────────────────────────────
  for (const field of ["website", "logo_url"] as const) {
    if (has(field)) {
      const raw = trimmed(input[field]);
      if (!raw) {
        value[field] = null;
      } else {
        const safe = safeHttpUrl(raw);
        if (!safe) {
          errors[field] = "Use a full http:// or https:// link";
        } else {
          value[field] = safe;
        }
      }
    }
  }

  if (has("is_active")) {
    if (typeof input.is_active === "boolean") {
      value.is_active = input.is_active;
    } else {
      errors.is_active = "Must be true or false";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: value as P extends true ? Partial<PartnerInput> : PartnerInput,
  };
}

/** Exported for the id-only patch path, which shares the uuid check. */
export const PARTNER_UUID = UUID;
