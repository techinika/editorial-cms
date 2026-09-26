"use client";

import { Archive, Loader2, Save, Send, Sparkles, Wand2 } from "lucide-react";
import VideoExtras from "@/components/videos/VideoExtras";
import type { useVideoForm } from "@/components/videos/useVideoForm";
import type { VideoCategory, VideoProvider } from "@/types/video";

const inputClass =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const aiButton =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#3182ce] text-[#3182ce] rounded-md hover:bg-[#3182ce]/5 transition-colors text-xs font-medium disabled:opacity-50";

type FormHook = ReturnType<typeof useVideoForm>;

interface VideoFormProps {
  form: FormHook;
  categories: VideoCategory[];
  editingTitle?: string | null;
  siteUrl: string;
  mainSiteUrl: string;
}

export default function VideoForm({
  form,
  categories,
  editingTitle,
  siteUrl,
  mainSiteUrl,
}: VideoFormProps) {
  const { errors, saving, generating, uploading, providerPreview } = form;
  const busy = saving || generating !== null;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-white rounded-lg border border-gray-200 p-6 mb-8"
    >
      <h3 className="text-lg font-semibold mb-1">
        {editingTitle ? "Edit Video" : "Add New Video"}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Paste the YouTube or Vimeo URL — the player id is extracted on save.
        {editingTitle && ` Editing "${editingTitle}".`}
      </p>

      <div className="space-y-4">
        {/* title + slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.form.title}
              onChange={(e) => form.onTitleChange(e.target.value)}
              placeholder="Video title"
              required
              className={inputClass}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.form.slug}
              onChange={(e) => form.onSlugChange(e.target.value)}
              placeholder="generated-from-the-title"
              required
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              {siteUrl}/watch/{form.form.slug || "…"}
            </p>
            {errors.slug && (
              <p className="text-xs text-red-600 mt-1">{errors.slug}</p>
            )}
          </div>
        </div>

        {/* provider + url + AI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Provider</label>
            <select
              value={form.form.provider}
              onChange={(e) =>
                form.setField("provider", e.target.value as VideoProvider)
              }
              className={inputClass}
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              Video URL or ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.form.provider_id}
              onChange={(e) => form.setField("provider_id", e.target.value)}
              placeholder={
                form.form.provider === "youtube"
                  ? "https://www.youtube.com/watch?v=…"
                  : "https://vimeo.com/…"
              }
              required
              className={inputClass}
            />
            {errors.provider_id ? (
              <p className="text-xs text-red-600 mt-1">{errors.provider_id}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                {providerPreview
                  ? `Will be stored as: ${providerPreview}`
                  : "Paste a full watch URL, a share link, or the bare id."}
              </p>
            )}
          </div>
        </div>

        {/* AI buttons */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[#3182ce]/5 border border-[#3182ce]/20 rounded-md">
          <button
            type="button"
            onClick={form.generateDetails}
            disabled={busy}
            className={aiButton}
          >
            {generating === "details" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Generate details with AI
          </button>
          <button
            type="button"
            onClick={form.generateSeo}
            disabled={busy}
            className={aiButton}
          >
            {generating === "seo" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            Generate SEO summary &amp; tags
          </button>
          <p className="text-xs text-gray-500">
            Reads the video&apos;s real title from the provider, so it won&apos;t
            invent the content. Your text always wins.
          </p>
        </div>

        {/* summary */}
        <div>
          <label className={labelClass}>
            Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.form.summary}
            onChange={(e) => form.setField("summary", e.target.value)}
            placeholder="One or two sentences. Also used as the SEO meta description."
            rows={2}
            required
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            {form.form.summary.length}/160 characters — this is the SEO meta
            description.
          </p>
          {errors.summary && (
            <p className="text-xs text-red-600 mt-1">{errors.summary}</p>
          )}
        </div>

        {/* series + duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Series <span className="text-red-500">*</span>
            </label>
            <select
              value={form.form.category_id}
              onChange={(e) => form.setField("category_id", e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a series…</option>
              {categories
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Duration</label>
            <input
              type="text"
              value={form.form.duration}
              onChange={(e) => form.setField("duration", e.target.value)}
              placeholder="e.g. 42:10 or 2530"
              className={inputClass}
            />
            {errors.duration && (
              <p className="text-xs text-red-600 mt-1">{errors.duration}</p>
            )}
          </div>
        </div>

        <VideoExtras form={form} mainSiteUrl={mainSiteUrl} />
      </div>

      {/* The buttons are the status control: there is no status dropdown. */}
      <div className="flex flex-wrap justify-end items-center gap-3 pt-4 mt-4 border-t border-gray-100">
        {editingTitle && (
          <button
            type="button"
            onClick={() => form.submit("archive")}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-amber-700 rounded-md transition-colors text-sm font-medium disabled:opacity-50 mr-auto"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={form.cancel}
          disabled={busy}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => form.submit("draft")}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save draft
        </button>
        <button
          type="button"
          onClick={() => form.submit("publish")}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Publish
        </button>
      </div>
    </form>
  );
}
