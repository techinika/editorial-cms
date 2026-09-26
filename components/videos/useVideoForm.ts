"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  slugify,
  autoSlug,
  formatDuration,
  parseDurationToSeconds,
  extractProviderId,
} from "@/lib/video";
import type { VideoIntent, VideoProvider, VideoWithCategory } from "@/types/video";

export interface VideoFormState {
  title: string;
  slug: string;
  summary: string;
  description: string;
  companion_article_slug: string;
  provider: VideoProvider;
  provider_id: string;
  thumbnail: string;
  category_id: string;
  tags: string;
  duration: string;
  scheduled_at: string;
  is_featured: boolean;
  notice: string;
}

export const emptyVideoForm = (categoryId = ""): VideoFormState => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  companion_article_slug: "",
  provider: "youtube",
  provider_id: "",
  thumbnail: "",
  category_id: categoryId,
  tags: "",
  duration: "",
  scheduled_at: "",
  is_featured: false,
  notice: "",
});

const fromVideo = (video: VideoWithCategory): VideoFormState => ({
  title: video.title,
  slug: video.slug,
  summary: video.summary,
  description: video.description ?? "",
  companion_article_slug: video.companion_article_slug ?? "",
  provider: video.provider,
  provider_id: video.provider_id,
  thumbnail: video.thumbnail ?? "",
  category_id: video.category_id,
  tags: video.tags ?? "",
  duration: video.duration ? formatDuration(video.duration) : "",
  scheduled_at: video.scheduled_at ? toLocalInput(video.scheduled_at) : "",
  is_featured: video.is_featured,
  notice: video.notice ?? "",
});

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO instant. */
const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export function useVideoForm(
  editing: VideoWithCategory | null,
  defaultCategoryId: string,
  onSaved: () => Promise<void> | void,
  onCancel: () => void,
) {
  const { showToast } = useToast();
  const [form, setForm] = useState<VideoFormState>(() =>
    editing ? fromVideo(editing) : emptyVideoForm(defaultCategoryId)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<"details" | "seo" | null>(null);
  const [uploading, setUploading] = useState(false);
  // Once the editor edits the slug by hand, stop overwriting it from the title.
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));

  const setField = useCallback(
    <K extends keyof VideoFormState>(key: K, value: VideoFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const onTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => ({
        ...prev,
        title,
        slug: slugTouched ? prev.slug : slugify(title),
      }));
    },
    [slugTouched]
  );

  const onSlugChange = useCallback((slug: string) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug }));
  }, []);

  /** Pulls the provider id out of whatever was pasted, for the live hint. */
  const providerPreview = extractProviderId(form.provider_id, form.provider);

  const generateDetails = useCallback(async () => {
    if (!form.provider_id.trim()) {
      showToast("error", "Paste the video URL first");
      return;
    }
    setGenerating("details");
    try {
      const res = await fetch("/api/videos/generate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          url: form.provider_id,
          notes: form.description,
          existingTitle: form.title,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Could not generate the video details");
        return;
      }
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        summary: data.summary || prev.summary,
        description: data.description || prev.description,
        tags: data.tags || prev.tags,
        // Vimeo reports a real runtime; take it rather than making the editor
        // type it, but never clobber a value already typed in.
        duration: data.duration && !prev.duration
          ? formatDuration(data.duration)
          : prev.duration,
        slug: slugTouched ? prev.slug : autoSlug(data.title || prev.title),
      }));
      if (data.sourceTitle && data.sourceTitle !== form.title) {
        showToast("success", `Generated from "${data.sourceTitle}"`);
      } else {
        showToast("success", "Video details generated");
      }
    } catch (error) {
      console.error("Failed to generate video details:", error);
      showToast("error", "Could not generate the video details");
    } finally {
      setGenerating(null);
    }
  }, [form.provider, form.provider_id, form.description, form.title, slugTouched]);

  const generateSeo = useCallback(async () => {
    if (!form.title.trim()) {
      showToast("error", "Add a title first");
      return;
    }
    setGenerating("seo");
    try {
      const res = await fetch("/api/videos/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Could not generate SEO metadata");
        return;
      }
      setForm((prev) => ({
        ...prev,
        summary: data.summary || prev.summary,
        tags: data.tags || prev.tags,
      }));
      showToast("success", "SEO summary and tags generated");
    } catch (error) {
      console.error("Failed to generate video SEO:", error);
      showToast("error", "Could not generate SEO metadata");
    } finally {
      setGenerating(null);
    }
  }, [form.title, form.description]);

  const uploadThumbnail = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/videos/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: dataUrl, fileName: file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Could not upload the thumbnail");
        return;
      }
      setField("thumbnail", data.url);
      showToast("success", "Thumbnail uploaded");
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
      showToast("error", "Could not upload the thumbnail");
    } finally {
      setUploading(false);
    }
  }, [setField]);

  const submit = useCallback(
    async (intent: VideoIntent) => {
      setSaving(true);
      setErrors({});
      try {
        const res = await fetch(
          editing ? `/api/videos/${editing.id}` : "/api/videos",
          {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            // No status and no published_at: the server derives both from
            // `intent`, so the button is the only thing that decides them.
            body: JSON.stringify({
              intent,
              title: form.title,
              slug: form.slug,
              summary: form.summary,
              description: form.description || null,
              companion_article_slug: form.companion_article_slug || null,
              provider: form.provider,
              provider_id: form.provider_id,
              thumbnail: form.thumbnail || null,
              category_id: form.category_id,
              tags: form.tags || null,
              duration: form.duration
                ? parseDurationToSeconds(form.duration)
                : null,
              scheduled_at: form.scheduled_at || null,
              is_featured: form.is_featured,
              notice: form.notice || null,
            }),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrors(data.details ?? {});
          showToast("error", data.error || "Failed to save the video");
          return;
        }

        showToast(
          "success",
          intent === "publish"
            ? "Video published"
            : intent === "archive"
              ? "Video archived"
              : editing
                ? "Draft saved"
                : "Draft created"
        );
        await onSaved();
      } catch (error) {
        console.error("Failed to save video:", error);
        showToast("error", "Failed to save the video");
      } finally {
        setSaving(false);
      }
    },
    [editing, form, onSaved]
  );

  return {
    form,
    errors,
    saving,
    generating,
    uploading,
    providerPreview,
    setField,
    onTitleChange,
    onSlugChange,
    generateDetails,
    generateSeo,
    uploadThumbnail,
    submit,
    cancel: onCancel,
  };
}
