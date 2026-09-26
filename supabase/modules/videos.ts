import { getSupabaseAdminClient } from "../supabase";
import type {
  Video,
  VideoCategory,
  VideoInput,
  VideoStatus,
  VideoWithCategory,
} from "@/types/video";

/**
 * Video data for the CMS.
 *
 * Every function here goes through the service-role client on purpose. The
 * `videos` RLS policy on techinika-tv only lets anon/authenticated see
 * `status = 'published' and published_at <= now()`, so an anon client would
 * silently hide every draft, scheduled and archived video from this screen —
 * the CMS would look empty and "create" would appear to work while the row
 * stayed invisible to the person who just wrote it.
 *
 * Server-side only. Never import this from a client component; the service key
 * would end up in the browser bundle. The client reaches these through the
 * /api/videos routes, which are guarded by isAuthorizedEditor().
 */

export interface ListVideosOptions {
  search?: string;
  status?: VideoStatus | "all";
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

const CATEGORY_JOIN = "id,slug,name,color";

export async function getVideoCategories(): Promise<VideoCategory[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from("video_categories")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching video categories:", error);
    return [];
  }
  return (data as VideoCategory[]) ?? [];
}

/**
 * Columns the client is allowed to write. Anything else is dropped — notably
 * `views`, `likes`, `id` and the timestamps, so a crafted request can't inflate
 * view counts or rewrite a slug out from under the public site.
 */
function sanitiseInput(input: Partial<VideoInput>): Partial<VideoInput> {
  const allowed: (keyof VideoInput)[] = [
    "title",
    "slug",
    "summary",
    "description",
    "transcript",
    "companion_article_slug",
    "provider",
    "provider_id",
    "thumbnail",
    "category_id",
    "tags",
    "duration",
    "status",
    "published_at",
    "scheduled_at",
    "is_featured",
    "notice",
  ];

  const out: Partial<VideoInput> = {};
  // `key` is a union here, so TS can't narrow the write target to the matching
  // property type. The `key` value is already constrained to `allowed` above,
  // which is what makes this assignment safe.
  const target = out as Record<string, unknown>;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      target[key] = input[key];
    }
  }
  return out;
}

export async function listVideos(
  options: ListVideosOptions = {},
): Promise<{ videos: VideoWithCategory[]; total: number }> {
  const {
    search,
    status = "all",
    categoryId,
    page = 1,
    pageSize = 25,
  } = options;

  let query = getSupabaseAdminClient()
    .from("videos")
    .select(`*,video_categories(${CATEGORY_JOIN})`, { count: "exact" });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (search?.trim()) {
    // ilike rather than the tsvector index: the GIN index is built with the
    // 'simple' config for the public site's own search, and partial-word
    // matching is what an editor actually wants when scanning the list.
    const term = search.trim().replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Error listing videos:", error);
    return { videos: [], total: 0 };
  }

  return {
    videos: (data as VideoWithCategory[]) ?? [],
    total: count ?? 0,
  };
}

export async function getVideoById(
  id: string,
): Promise<VideoWithCategory | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("videos")
    .select(`*,video_categories(${CATEGORY_JOIN})`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching video:", error);
    return null;
  }
  return (data as VideoWithCategory) ?? null;
}

export async function getVideoBySlug(
  slug: string,
): Promise<Video | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("videos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching video by slug:", error);
    return null;
  }
  return (data as Video) ?? null;
}

export async function createVideo(
  input: VideoInput,
): Promise<Video | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("videos")
    .insert(sanitiseInput(input))
    .select()
    .single();

  if (error) {
    console.error("Error creating video:", error);
    return null;
  }
  return data as Video;
}

export async function updateVideo(
  id: string,
  input: Partial<VideoInput>,
): Promise<Video | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("videos")
    .update(sanitiseInput(input))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating video:", error);
    return null;
  }
  return data as Video;
}

export async function deleteVideo(id: string): Promise<boolean> {
  const { error } = await getSupabaseAdminClient()
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting video:", error);
    return false;
  }
  return true;
}
