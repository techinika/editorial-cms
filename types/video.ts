export type VideoProvider = "youtube" | "vimeo";

export type VideoStatus = "draft" | "published" | "archived";

/**
 * Which save button the editor pressed. The server turns this into the
 * status + published_at pair (see `resolvePublishState` in lib/video.ts) — the
 * form never sends either field itself.
 *
 * Declared here rather than in lib/video.ts so the types module stays the leaf
 * of the dependency graph.
 */
export type VideoIntent = "draft" | "publish" | "archive";

export interface VideoCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tagline: string | null;
  color: string;
  icon: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  transcript: string | null;
  companion_article_slug: string | null;
  provider: VideoProvider;
  provider_id: string;
  thumbnail: string | null;
  category_id: string;
  tags: string | null;
  duration: number | null;
  status: VideoStatus;
  published_at: string | null;
  scheduled_at: string | null;
  views: number;
  likes: number;
  is_featured: boolean;
  notice: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape returned by the list query, which joins the category in. */
export interface VideoWithCategory extends Video {
  video_categories: Pick<
    VideoCategory,
    "id" | "slug" | "name" | "color"
  > | null;
}

export interface VideoInput {
  title: string;
  slug: string;
  summary: string;
  description?: string | null;
  companion_article_slug?: string | null;
  provider: VideoProvider;
  provider_id: string;
  thumbnail?: string | null;
  category_id: string;
  tags?: string | null;
  duration?: number | null;
  status: VideoStatus;
  published_at?: string | null;
  scheduled_at?: string | null;
  is_featured?: boolean;
  notice?: string | null;
}

/**
 * What the write routes accept from the client: a VideoInput minus the fields
 * the server owns. `status` and `published_at` are decided by the button the
 * editor pressed (see `resolvePublishState`), never by the request body.
 */
export type VideoWriteBody = Omit<
  VideoInput,
  "status" | "published_at"
> & {
  intent: VideoIntent;
  slug?: string;
  published_at?: string | null;
};

/** One row of the combobox that picks a related article. */
export interface ArticleOption {
  id: string;
  title: string;
  slug: string;
  status?: string | null;
}

export interface VideoListResult {
  videos: VideoWithCategory[];
  total: number;
}
