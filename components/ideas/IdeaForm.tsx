"use client";

import React, { useState } from "react";
import Modal from "@/components/Modal";
import {
  CONTENT_TYPE_LABELS,
  IDEA_STATUSES,
  IDEA_STATUS_LABELS,
} from "@/lib/idea";
import type {
  ArticleIdea,
  ArticleIdeaInput,
  AssignableAuthor,
  ContentType,
  IdeaStatus,
  Partner,
} from "@/types/idea";

interface IdeaFormProps {
  open: boolean;
  onClose: () => void;
  /** null = create a new idea. */
  idea: ArticleIdea | null;
  authors: AssignableAuthor[];
  partners: Partner[];
  saving?: boolean;
  onSubmit: (input: ArticleIdeaInput) => Promise<{ ok: boolean; errors: Record<string, string> | null }>;
}

const EMPTY: ArticleIdeaInput = {
  title: "",
  lead_name: "",
  contact_email: "",
  contact_phone: "",
  concept: "",
  notes: "",
  source_url: "",
  status: "idea",
  content_type: "editorial",
  assigned_author_id: null,
  partner_id: null,
};

export default function IdeaForm({
  open,
  onClose,
  idea,
  authors,
  partners,
  saving = false,
  onSubmit,
}: IdeaFormProps) {
  const [form, setForm] = useState<ArticleIdeaInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset when the modal is opened for a different idea, without an effect
  // that would fight the user's typing.
  const key = idea?.id ?? "new";
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (open && key !== lastKey) {
    setLastKey(key);
    setErrors({});
    setForm(
      idea
        ? {
            title: idea.title,
            lead_name: idea.lead_name ?? "",
            contact_email: idea.contact_email ?? "",
            contact_phone: idea.contact_phone ?? "",
            concept: idea.concept ?? "",
            notes: idea.notes ?? "",
            source_url: idea.source_url ?? "",
            status: idea.status,
            content_type: idea.content_type,
            assigned_author_id: idea.assigned_author_id,
            partner_id: idea.partner_id,
          }
        : EMPTY
    );
  }
  if (!open && lastKey !== null) setLastKey(null);

  const set = <K extends keyof ArticleIdeaInput>(key: K, value: ArticleIdeaInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: ArticleIdeaInput = {
      ...form,
      title: form.title?.trim() ?? "",
      lead_name: form.lead_name?.trim() || null,
      contact_email: form.contact_email?.trim() || null,
      contact_phone: form.contact_phone?.trim() || null,
      concept: form.concept?.trim() || null,
      notes: form.notes?.trim() || null,
      source_url: form.source_url?.trim() || null,
    };
    const result = await onSubmit(payload);
    if (result.ok) {
      onClose();
    } else if (result.errors) {
      setErrors(result.errors);
    }
  };

  const label = "block text-xs font-medium text-gray-700 mb-1";
  const inputClass =
    "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={idea ? "Edit idea" : "Log a new idea"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div>
          <label className={label} htmlFor="idea-title">Title / idea *</label>
          <input
            id="idea-title"
            autoFocus
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
            placeholder="What is the story?"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className={label} htmlFor="idea-concept">Concept / brief</label>
          <textarea
            id="idea-concept"
            value={form.concept ?? ""}
            onChange={(e) => set("concept", e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="The angle, why it matters, who it's for. This is what the author writes from, and it is carried into the draft."
          />
          {errors.concept && <p className="mt-1 text-xs text-red-600">{errors.concept}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="idea-lead">Lead name</label>
            <input
              id="idea-lead"
              value={form.lead_name ?? ""}
              onChange={(e) => set("lead_name", e.target.value)}
              className={inputClass}
            />
            {errors.lead_name && <p className="mt-1 text-xs text-red-600">{errors.lead_name}</p>}
          </div>
          <div>
            <label className={label} htmlFor="idea-email">Contact email</label>
            <input
              id="idea-email"
              type="email"
              value={form.contact_email ?? ""}
              onChange={(e) => set("contact_email", e.target.value)}
              className={inputClass}
            />
            {errors.contact_email && <p className="mt-1 text-xs text-red-600">{errors.contact_email}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="idea-phone">Contact phone</label>
            <input
              id="idea-phone"
              value={form.contact_phone ?? ""}
              onChange={(e) => set("contact_phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={label} htmlFor="idea-source">Source URL</label>
            <input
              id="idea-source"
              value={form.source_url ?? ""}
              onChange={(e) => set("source_url", e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
            {errors.source_url && <p className="mt-1 text-xs text-red-600">{errors.source_url}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="idea-assignee">Assign to</label>
            <select
              id="idea-assignee"
              value={form.assigned_author_id ?? ""}
              onChange={(e) => set("assigned_author_id", e.target.value || null)}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.assigned_author_id && (
              <p className="mt-1 text-xs text-red-600">{errors.assigned_author_id}</p>
            )}
          </div>
          <div>
            <label className={label} htmlFor="idea-status">Stage</label>
            <select
              id="idea-status"
              value={form.status ?? "idea"}
              onChange={(e) => set("status", e.target.value as IdeaStatus)}
              className={inputClass}
            >
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s}>{IDEA_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="idea-type">Content type</label>
            <select
              id="idea-type"
              value={form.content_type ?? "editorial"}
              onChange={(e) => set("content_type", e.target.value as ContentType)}
              className={inputClass}
            >
              {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((t) => (
                <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Separate from the public “Sponsored” flag.
            </p>
          </div>
          <div>
            <label className={label} htmlFor="idea-partner">Partner</label>
            <select
              id="idea-partner"
              value={form.partner_id ?? ""}
              onChange={(e) => set("partner_id", e.target.value || null)}
              className={inputClass}
            >
              <option value="">No partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="idea-notes">Notes</label>
          <textarea
            id="idea-notes"
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Deadlines, legal considerations, anything else."
          />
          {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
        </div>

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
            {saving ? "Saving…" : idea ? "Save changes" : "Log idea"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
