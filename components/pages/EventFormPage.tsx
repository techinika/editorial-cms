"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  Save,
  Send,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import CompanySearchInput from "@/components/companies/CompanySearchInput";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";
import { generateSlug } from "@/lib/content-parser";
import { createEvent, getAllAuthorsWithRoles } from "@/supabase/CRUD/queries";
import { EVENT_FORMATS, EVENT_STATUSES } from "@/supabase/CRUD/queries";
import { EventFormat, EventStatus } from "@/types/event";

interface EventFormPageProps {
  user?: AuthResult;
}

interface AuthorOption {
  id: string;
  name: string;
}

export default function EventFormPage({ user }: EventFormPageProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<string>("Conference");
  const [status, setStatus] = useState<string>("Upcoming");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [organizer, setOrganizer] = useState<{ id: string; name: string } | null>(null);
  const [contactPersonId, setContactPersonId] = useState("");
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [tags, setTags] = useState("");
  const [registrationType, setRegistrationType] = useState<
    "none" | "platform" | "external"
  >("none");
  const [externalLink, setExternalLink] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    const data = await getAllAuthorsWithRoles();
    setAuthors(data.map((a) => ({ id: a.id, name: a.name })));
  };

  const validateDates = (): boolean => {
    setDateError(null);
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setDateError("End date/time cannot be before start date/time");
      return false;
    }
    return true;
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      showToast("error", "Title is required");
      return;
    }
    if (!validateDates()) return;

    setIsSaving(true);
    try {
      const slug =
        generateSlug(title) + "-" + Date.now().toString(36);

      const created = await createEvent({
        title: title.trim(),
        slug,
        lang: "english",
        location: location.trim() || null,
        format: format as EventFormat,
        status: status as EventStatus,
        publish_status: publish ? "published" : "draft",
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        seo_description: seoDescription.trim() || null,
        full_description: fullDescription.trim() || null,
        tags: tags.trim() || null,
        external_link:
          registrationType === "platform"
            ? "register"
            : registrationType === "external"
              ? externalLink.trim() || null
              : null,
        organizer_id: organizer?.id || null,
        contact_person_id: contactPersonId || null,
        is_featured: isFeatured,
        views: 0,
      });

      if (!created) {
        showToast("error", "Failed to create event");
        return;
      }

      showToast(
        "success",
        `Event ${publish ? "published" : "saved as draft"}!`
      );
      router.push("/");
    } catch (err) {
      console.error("Error saving event:", err);
      showToast("error", "Failed to create event");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 transition-all";

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Event title..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
                  {EVENT_FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
                placeholder="City, venue or 'Online'..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {dateError && <p className="text-xs text-red-600">{dateError}</p>}

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4" />
                Organizer (Company)
              </label>
              <CompanySearchInput value={organizer} onChange={setOrganizer} />
              <p className="text-xs text-gray-500 mt-1">
                Search for the hosting company. Leave empty if not applicable.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <select
                value={contactPersonId}
                onChange={(e) => setContactPersonId(e.target.value)}
                className={inputClass}
              >
                <option value="">None...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputClass}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
                <select
                  value={registrationType}
                  onChange={(e) =>
                    setRegistrationType(
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

            {registrationType === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration URL *
                </label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            )}
            {registrationType === "platform" && (
              <p className="text-xs text-blue-600">
                Attendees will register through the Techinika event RSVP page.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                maxLength={160}
                className={inputClass}
                placeholder="Short description for search engines (max 160 characters)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={5}
                className={inputClass}
                placeholder="Detailed event description..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#3182ce]"
              />
              Feature this event
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
