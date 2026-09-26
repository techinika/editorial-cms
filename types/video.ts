export type VideoProvider = "youtube" | "vimeo";

export type VideoStatus = "draft" | "published" | "archived";

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
  transcript?: string | null;
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

export interface VideoListResult {
  videos: VideoWithCategory[];
  total: number;
}
