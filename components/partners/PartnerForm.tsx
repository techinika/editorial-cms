"use client";

import React, { useState } from "react";
import Modal from "@/components/Modal";
import { slugify } from "@/lib/idea";
import type { Partner, PartnerInput } from "@/types/idea";

interface PartnerFormProps {
  open: boolean;
  onClose: () => void;
  partner: Partner | null;
  saving?: boolean;
  onSubmit: (input: PartnerInput) => Promise<{ ok: boolean; errors: Record<string, string> | null }>;
}

const EMPTY: PartnerInput = {
  name: "",
  slug: "",
  description: "",
  website: "",
  logo_url: "",
  contact_name: "",
  contact_email: "",
  notes: "",
  is_active: true,
};

export default function PartnerForm({
  open, onClose, partner, saving = false, onSubmit,
}: PartnerFormProps) {
  const [form, setForm] = useState<PartnerInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const key = partner?.id ?? "new";
  if (open && key !== lastKey) {
    setLastKey(key);
    setErrors({});
    setSlugTouched(Boolean(partner));
    setForm(
      partner
        ? {
            name: partner.name,
            slug: partner.slug,
            description: partner.description ?? "",
            website: partner.website ?? "",
            logo_url: partner.logo_url ?? "",
            contact_name: partner.contact_name ?? "",
            contact_email: partner.contact_email ?? "",
            notes: partner.notes ?? "",
            is_active: partner.is_active,
          }
        : EMPTY
    );
  }
  if (!open && lastKey !== null) setLastKey(null);

  const set = <K extends keyof PartnerInput>(k: K, v: PartnerInput[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => {
      const key = k as string;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await onSubmit({
      ...form,
      name: form.name?.trim() ?? "",
      slug: slugify(form.slug?.trim() || form.name || ""),
      description: form.description?.trim() || null,
      website: form.website?.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      contact_name: form.contact_name?.trim() || null,
      contact_email: form.contact_email?.trim() || null,
      notes: form.notes?.trim() || null,
    });
    if (result.ok) onClose();
    else if (result.errors) setErrors(result.errors);
  };

  const label = "block text-xs font-medium text-gray-700 mb-1";
  const input =
    "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <Modal open={open} onClose={onClose} title={partner ? "Edit partner" : "Add partner"}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className={label} htmlFor="partner-name">Name *</label>
          <input
            id="partner-name"
            autoFocus
            value={form.name ?? ""}
            onChange={(e) => {
              set("name", e.target.value);
              // Keep the slug in step with the name until the editor overrides it.
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            className={input}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className={label} htmlFor="partner-slug">Slug</label>
          <input
            id="partner-slug"
            value={form.slug ?? ""}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            className={input}
            placeholder="derived from the name"
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
        </div>

        <div>
          <label className={label} htmlFor="partner-desc">Description</label>
          <textarea
            id="partner-desc"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={input}
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="partner-site">Website</label>
            <input
              id="partner-site"
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              className={input}
              placeholder="https://…"
            />
            {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
          </div>
          <div>
            <label className={label} htmlFor="partner-logo">Logo URL</label>
            <input
              id="partner-logo"
              value={form.logo_url ?? ""}
              onChange={(e) => set("logo_url", e.target.value)}
              className={input}
              placeholder="https://…"
            />
            {errors.logo_url && <p className="mt-1 text-xs text-red-600">{errors.logo_url}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="partner-contact">Contact name</label>
            <input
              id="partner-contact"
              value={form.contact_name ?? ""}
              onChange={(e) => set("contact_name", e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="partner-email">Contact email</label>
            <input
              id="partner-email"
              type="email"
              value={form.contact_email ?? ""}
              onChange={(e) => set("contact_email", e.target.value)}
              className={input}
            />
            {errors.contact_email && <p className="mt-1 text-xs text-red-600">{errors.contact_email}</p>}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="partner-notes">Internal notes</label>
          <textarea
            id="partner-notes"
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className={input}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Active — inactive partners stay on past articles but leave the pickers
        </label>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : partner ? "Save changes" : "Add partner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
