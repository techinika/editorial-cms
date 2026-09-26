"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Play, Plus, Search, Video as VideoIcon } from "lucide-react";
import TopNavbar from "@/components/TopNavbar";
import { useToast } from "@/components/Toast";
import VideoForm from "@/components/videos/VideoForm";
import VideoListRow from "@/components/videos/VideoListRow";
import { useVideoForm } from "@/components/videos/useVideoForm";
import { AuthResult } from "@/lib/auth";
import type {
  VideoCategory,
  VideoStatus,
  VideoWithCategory,
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

const SITE_URL = process.env.NEXT_PUBLIC_TV_SITE_URL || "https://tv.techinika.com";
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://techinika.com";

export default function VideosPage({ user }: VideosPageProps) {
  const { showToast } = useToast();
  const [videos, setVideos] = useState<VideoWithCategory[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VideoStatus | "all">("all");
  const [editing, setEditing] = useState<VideoWithCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, [searchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(loadVideos, 250);
    return () => clearTimeout(t);
  }, [loadVideos]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (video: VideoWithCategory) => {
    setEditing(video);
    setShowForm(true);
  };

  // `editing` identity changes on every open, and the hook seeds its state from
  // it, so remount the form by keying on the row being edited.
  const form = useVideoForm(
    editing,
    categories[0]?.id ?? "",
    async () => {
      closeForm();
      await loadVideos();
    },
    closeForm
  );

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
              onChange={(e) =>
                setStatusFilter(e.target.value as VideoStatus | "all")
              }
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
          <VideoForm
            key={editing?.id ?? "new"}
            form={form}
            categories={categories}
            editingTitle={editing?.title ?? null}
            siteUrl={SITE_URL}
            mainSiteUrl={MAIN_SITE_URL}
          />
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">
              {videos.length} video{videos.length === 1 ? "" : "s"}
              {total > videos.length && (
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  of {total}
                </span>
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
              {videos.map((video) => (
                <VideoListRow
                  key={video.id}
                  video={video}
                  siteUrl={SITE_URL}
                  deleting={deletingId === video.id}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {videos.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Only published videos appear on the public site. Drafts are hidden
            until you press Publish.
          </p>
        )}
      </main>
    </div>
  );
}
