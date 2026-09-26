"use client";

import ArticleSelectInput from "@/components/videos/ArticleSelectInput";
import ThumbnailField from "@/components/videos/ThumbnailField";
import type { useVideoForm } from "@/components/videos/useVideoForm";

const inputClass =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

interface VideoExtrasProps {
  form: ReturnType<typeof useVideoForm>;
  mainSiteUrl: string;
}

/**
 * The presentation half of the video form: the copy and artwork that hang off
 * an already-identified video. Split out of VideoForm purely to keep each file
 * inside the 300-line budget in AGENTS.md.
 */
export default function VideoExtras({ form, mainSiteUrl }: VideoExtrasProps) {
  const { errors, uploading } = form;

  return (
    <>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.form.description}
          onChange={(e) => form.setField("description", e.target.value)}
          placeholder="Shown on the watch page. Plain text."
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Thumbnail</label>
          <ThumbnailField
            value={form.form.thumbnail}
            onChange={(url) => form.setField("thumbnail", url)}
            onUpload={form.uploadThumbnail}
            uploading={uploading}
            error={errors.thumbnail}
          />
        </div>
        <div>
          <label className={labelClass}>Tags</label>
          <input
            type="text"
            value={form.form.tags}
            onChange={(e) => form.setField("tags", e.target.value)}
            placeholder="comma, separated, tags"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Related article</label>
        <ArticleSelectInput
          value={form.form.companion_article_slug}
          onChange={(slug) => form.setField("companion_article_slug", slug)}
          siteUrl={mainSiteUrl}
        />
        {errors.companion_article_slug && (
          <p className="text-xs text-red-600 mt-1">
            {errors.companion_article_slug}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Notice</label>
          <input
            type="text"
            value={form.form.notice}
            onChange={(e) => form.setField("notice", e.target.value)}
            placeholder="Optional banner on the watch page"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Scheduled for</label>
          <input
            type="datetime-local"
            value={form.form.scheduled_at}
            onChange={(e) => form.setField("scheduled_at", e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Editorial marker only. Publishing is what puts it on the site.
          </p>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.form.is_featured}
              onChange={(e) => form.setField("is_featured", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#3182ce] focus:ring-[#3182ce]"
            />
            Feature on the homepage
          </label>
        </div>
      </div>
    </>
  );
}
