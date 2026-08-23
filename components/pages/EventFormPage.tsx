"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  Save,
  Send,
  Building2,
  Sparkles,
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import CompanySearchInput from "@/components/companies/CompanySearchInput";
import RichTextEditor from "@/components/events/RichTextEditor";
import { useEventForm } from "@/components/events/useEventForm";
import { AuthResult } from "@/lib/auth";
import { EVENT_FORMATS, EVENT_STATUSES } from "@/supabase/CRUD/queries";

interface EventFormPageProps {
  user?: AuthResult;
}

const inputClass =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 transition-all";

export default function EventFormPage({ user }: EventFormPageProps) {
  const form = useEventForm();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="Create Event"
        icon={<Calendar className="text-white w-6 h-6" />}
        user={user}
      />

      <main className="max-w-3xl mx-auto p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">New Event</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => form.setTitle(e.target.value)}
                className={inputClass}
                placeholder="Event title..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
                <select value={form.format} onChange={(e) => form.setFormat(e.target.value)} className={inputClass}>
                  {EVENT_FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => form.setStatus(e.target.value)} className={inputClass}>
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => form.setLocation(e.target.value)}
                className={inputClass}
                placeholder="City, venue or 'Online'..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => form.setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => form.setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {form.dateError && <p className="text-xs text-red-600">{form.dateError}</p>}

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4" />
                Organizer (Company)
              </label>
              <CompanySearchInput value={form.organizer} onChange={form.setOrganizer} />
              <p className="text-xs text-gray-500 mt-1">
                Search for the hosting company. Leave empty if not applicable.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <select
                value={form.contactPersonId}
                onChange={(e) => form.setContactPersonId(e.target.value)}
                className={inputClass}
              >
                <option value="">None...</option>
                {form.authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => form.setTags(e.target.value)}
                  className={inputClass}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
                <select
                  value={form.registrationType}
                  onChange={(e) =>
                    form.setRegistrationType(
                      e.target.value as "none" | "platform" | "external"
                    )
                  }
                  className={inputClass}
                >
                  <option value="none">No registration link</option>
                  <option value="platform">Platform registration (RSVP page)</option>
                  <option value="external">External link</option>
                </select>
              </div>
            </div>

            {form.registrationType === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration URL *
                </label>
                <input
                  type="url"
                  value={form.externalLink}
                  onChange={(e) => form.setExternalLink(e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            )}
            {form.registrationType === "platform" && (
              <p className="text-xs text-blue-600">
                Attendees will register through the Techinika event RSVP page.
              </p>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">SEO Description</label>
                <button
                  type="button"
                  onClick={form.handleGenerateSeo}
                  disabled={form.isGeneratingSeo}
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 transition-colors text-xs font-medium disabled:opacity-50"
                  title="Generate tags & SEO description from title and full description"
                >
                  {form.isGeneratingSeo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate with AI
                </button>
              </div>
              <textarea
                value={form.seoDescription}
                onChange={(e) => form.setSeoDescription(e.target.value)}
                rows={2}
                maxLength={160}
                className={inputClass}
                placeholder="Short description for search engines (max 160 characters)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description (formatted, stored as HTML)
              </label>
              <RichTextEditor
                content={form.fullDescription}
                onChange={form.setFullDescription}
                placeholder="Detailed event description — headings, lists, links..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => form.setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#3182ce]"
              />
              Feature this event
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={() => form.handleSave(false)}
              disabled={form.isSaving || !form.title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => form.handleSave(true)}
              disabled={form.isSaving || !form.title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
