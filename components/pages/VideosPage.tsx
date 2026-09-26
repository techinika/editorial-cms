"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Play,
  Video as VideoIcon,
  ExternalLink,
  Star,
  Eye,
} from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import { useToast } from "@/components/Toast";
import { AuthResult } from "@/lib/auth";
import {
  slugify,
  formatDuration,
  formatDate,
  isLive,
  extractProviderId,
  parseDurationToSeconds,
} from "@/lib/video";
import type {
  VideoWithCategory,
  VideoCategory,
  VideoProvider,
  VideoStatus,
  VideoInput,
} from "@/types/video";

interface VideosPageProps {
  user?: AuthResult;
}

const STATUS_FILTERS: { value: VideoStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<VideoStatus, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  archived: "bg-amber-100 text-amber-800",
};

const inputClass =
  "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

interface FormState {
  title: string;
  slug: string;
  summary: string;
  description: string;
  transcript: string;
  companion_article_slug: string;
  provider: VideoProvider;
  provider_id: string;
  thumbnail: string;
  category_id: string;
  tags: string;
  duration: string;
  status: VideoStatus;
  published_at: string;
  scheduled_at: string;
  is_featured: boolean;
  notice: string;
}

const emptyForm = (categoryId = ""): FormState => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  transcript: "",
  companion_article_slug: "",
  provider: "youtube",
  provider_id: "",
  thumbnail: "",
  category_id: categoryId,
  tags: "",
  duration: "",
  status: "draft",
  published_at: "",
  scheduled_at: "",
  is_featured: false,
  notice: "",
});

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO instant. */
const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export default function VideosPage({ user }: VideosPageProps) {
  const { showToast } = useToast();
  const [videos, setVideos] = useState<VideoWithCategory[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VideoStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VideoWithCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const SITE_URL =
    process.env.NEXT_PUBLIC_TV_SITE_URL || "https://tv.techinika.com";

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/videos?categories=1");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (error) {
      console.error("Failed to load video categories:", error);
    }
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("pageSize", "100");

      const res = await fetch(`/api/videos?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          showToast("error", "You are not allowed to manage videos");
        }
        return;
      }
      const data = await res.json();
      setVideos(data.videos ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Failed to load videos:", error);
      showToast("error", "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(loadVideos, 250);
    return () => clearTimeout(t);
  }, [loadVideos]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm(categories[0]?.id ?? ""));
    setEditing(null);
    setFormErrors({});
    setSlugTouched(false);
    setShowForm(false);
  };

  const startCreate = () => {
    setForm(emptyForm(categories[0]?.id ?? ""));
    setEditing(null);
    setFormErrors({});
    setSlugTouched(false);
    setShowForm(true);
  };

  const startEdit = (video: VideoWithCategory) => {
    setForm({
      title: video.title,
      slug: video.slug,
      summary: video.summary,
      description: video.description ?? "",
      transcript: video.transcript ?? "",
      companion_article_slug: video.companion_article_slug ?? "",
      provider: video.provider,
      provider_id: video.provider_id,
      thumbnail: video.thumbnail ?? "",
      category_id: video.category_id,
      tags: video.tags ?? "",
      duration: video.duration ? formatDuration(video.duration) : "",
      status: video.status,
      published_at: toDateTimeLocal(video.published_at),
      scheduled_at: toDateTimeLocal(video.scheduled_at),
      is_featured: video.is_featured,
      notice: video.notice ?? "",
    });
    setEditing(video);
    setFormErrors({});
    setSlugTouched(true);
    setShowForm(true);
  };

  // Live preview of what will be stored, so an editor can see the bare id
  // before saving rather than discovering a broken player on the public site.
  const providerPreview = useMemo(
    () => extractProviderId(form.provider_id, form.provider),
    [form.provider_id, form.provider]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});

    const payload: VideoInput = {
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      description: form.description || null,
      transcript: form.transcript || null,
      companion_article_slug: form.companion_article_slug || null,
      provider: form.provider,
      provider_id: form.provider_id,
      thumbnail: form.thumbnail || null,
      category_id: form.category_id,
      tags: form.tags || null,
      duration: form.duration ? parseDurationToSeconds(form.duration) : null,
      status: form.status,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      is_featured: form.is_featured,
      notice: form.notice || null,
    };

    try {
      const res = await fetch(
        editing ? `/api/videos/${editing.id}` : "/api/videos",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormErrors(data.details ?? {});
        showToast("error", data.error || "Failed to save video");
        return;
      }

      showToast("success", editing ? "Video updated" : "Video created");
      resetForm();
      await loadVideos();
    } catch (error) {
      console.error("Failed to save video:", error);
      showToast("error", "Failed to save video");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (video: VideoWithCategory) => {
    if (
      !window.confirm(
        `Delete "${video.title}"? This cannot be undone. The article's asset is not affected.`
      )
    ) {
      return;
    }

    setDeletingId(video.id);
    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", data.error || "Failed to delete video");
        return;
      }
      showToast("success", "Video deleted");
      await loadVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
      showToast("error", "Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <TopNavbar
        title="Videos"
        icon={<VideoIcon className="text-white w-6 h-6" />}
        user={user}
        center={
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 group-focus-within:text-[#3182ce]" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VideoStatus | "all")}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce]"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        }
        actions={
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-1">
              {editing ? "Edit Video" : "Add New Video"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Paste the YouTube or Vimeo URL — the player id is extracted on save.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* title + slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setField("title", e.target.value);
                      if (!slugTouched) setField("slug", slugify(e.target.value));
                    }}
                    placeholder="Video title"
                    required
                    className={inputClass}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setField("slug", e.target.value);
                    }}
                    placeholder="video-slug"
                    required
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {SITE_URL}/watch/{form.slug || "…"}
                  </p>
                  {formErrors.slug && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>
                  )}
                </div>
              </div>

              {/* summary */}
              <div>
                <label className={labelClass}>
                  Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  placeholder="One or two sentences. Shown on cards and used for SEO."
                  rows={2}
                  required
                  className={inputClass}
                />
                {formErrors.summary && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.summary}</p>
                )}
              </div>

              {/* provider + url */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Provider</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setField("provider", e.target.value as VideoProvider)}
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
                    value={form.provider_id}
                    onChange={(e) => setField("provider_id", e.target.value)}
                    placeholder={
                      form.provider === "youtube"
                        ? "https://www.youtube.com/watch?v=…"
                        : "https://vimeo.com/…"
                    }
                    required
                    className={inputClass}
                  />
                  {formErrors.provider_id ? (
                    <p className="text-xs text-red-600 mt-1">{formErrors.provider_id}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {providerPreview
                        ? `Will be stored as: ${providerPreview}`
                        : "Paste a full watch URL, a share link, or the bare id."}
                    </p>
                  )}
                </div>
              </div>

              {/* series, status, duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>
                    Series <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setField("category_id", e.target.value)}
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
                  {formErrors.category_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.category_id}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as VideoStatus)}
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setField("duration", e.target.value)}
                    placeholder="e.g. 42:10 or 2530"
                    className={inputClass}
                  />
                  {formErrors.duration && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.duration}</p>
                  )}
                </div>
              </div>

              {/* publish dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Published at</label>
                  <input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => setField("published_at", e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The site hides a video until this moment, even when published.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Scheduled for</label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setField("scheduled_at", e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Editorial marker. Does not hide the video on its own.
                  </p>
                </div>
              </div>

              {/* description, transcript */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Shown on the watch page. Supports plain text."
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Transcript</label>
                <textarea
                  value={form.transcript}
                  onChange={(e) => setField("transcript", e.target.value)}
                  placeholder="Optional. Shown under the player."
                  rows={3}
                  className={inputClass}
                />
              </div>

              {/* thumbnail, tags, companion */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Thumbnail URL</label>
                  <input
                    type="text"
                    value={form.thumbnail}
                    onChange={(e) => setField("thumbnail", e.target.value)}
                    placeholder="Leave blank to use the provider's image"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setField("tags", e.target.value)}
                    placeholder="comma, separated, tags"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Companion article slug</label>
                  <input
                    type="text"
                    value={form.companion_article_slug}
                    onChange={(e) => setField("companion_article_slug", e.target.value)}
                    placeholder="links to a blog post"
                    className={inputClass}
                  />
                  {formErrors.companion_article_slug && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.companion_article_slug}
                    </p>
                  )}
                </div>
              </div>

              {/* notice + featured */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Notice</label>
                  <input
                    type="text"
                    value={form.notice}
                    onChange={(e) => setField("notice", e.target.value)}
                    placeholder="Optional banner shown on the watch page"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setField("is_featured", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#3182ce] focus:ring-[#3182ce]"
                    />
                    Feature on the homepage
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editing ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editing ? "Save Changes" : "Create Video"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* list */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">
              {videos.length} video{videos.length === 1 ? "" : "s"}
              {total > videos.length && (
                <span className="text-sm font-normal text-gray-500"> of {total}</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              Loading videos…
            </div>
          ) : videos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Play className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "No videos match this filter."
                  : "No videos yet. Add your first one to get the series started."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={startCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-md hover:bg-[#2c5282] transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Video
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {videos.map((video) => {
                const live = isLive(video.status, video.published_at);
                return (
                  <div
                    key={video.id}
                    className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50"
                  >
                    {/* thumbnail */}
                    <div className="w-32 h-20 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 relative">
                      {video.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Play className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_STYLES[video.status]
                          }`}
                        >
                          {video.status}
                        </span>
                        {live && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            live
                          </span>
                        )}
                        {video.is_featured && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        )}
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${video.video_categories?.color ?? "#3182ce"}1a`,
                            color: video.video_categories?.color ?? "#3182ce",
                          }}
                        >
                          {video.video_categories?.name ?? categoryName(video.category_id)}
                        </span>
                        {video.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-medium text-gray-900 mt-1 truncate">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {video.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span>{video.provider}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views.toLocaleString()}
                        </span>
                        <span>·</span>
                        <span>published {formatDate(video.published_at)}</span>
                      </div>
                    </div>

                    {/* actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={`${SITE_URL}/watch/${video.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on tv.techinika.com"
                        className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => startEdit(video)}
                        className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video)}
                        disabled={deletingId === video.id}
                        className="p-2 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === video.id ? (
                          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {videos.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Only published videos whose publish date has passed appear on the public site.
          </p>
        )}
      </main>
    </div>
  );
}
