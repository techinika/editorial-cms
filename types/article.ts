import { Author } from "./author";
import { Category } from "./category";
import { Asset } from "./asset";

export type ArticleStatus = "draft" | "published" | "cancelled";

export type Article = {
  id: string;
  lang: string;
  created_at: string;
  title: string;
  slug: string;
  author_id: string | null;
  category_id: string | null;
  date: string | null;
  read_time: string | null;
  image: string | null;
  content: string;
  table_of_contents: Record<string, unknown> | null;
  tags: string | null;
  summary: string | null;
  views: number;
  status: ArticleStatus | null;
  ai_summary: string | null;
  feedback: string | null;
  featured_images: string | null;
  sources: string | null;
  author_name: string | null;
  drafted_at: string | null;
  published_at: string | null;
  published_by: string | null;
  thumbnail_id: string | null;
};

export interface JoinedArticle extends Omit<
  Article,
  "author_id" | "category_id"
> {
  author: Author | null;
  category: Category | null;
  thumbnailAsset: Asset | null;
  hasPendingActivity?: boolean;
}

export interface ArticleFormData {
  title: string;
  slug?: string;
  content: string;
  image?: string | null;
  category_id?: string | null;
  tags?: string;
  summary?: string;
  read_time?: string;
  lang?: string;
  status?: ArticleStatus;
  author_id?: string | null;
  author_name?: string | null;
  date?: string | null;
  drafted_at?: string | null;
  feedback?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  thumbnail_id?: string | null;
}

export interface ArticleFeedback {
  id: string;
  created_at: string;
  author_id: string;
  article_id: string;
  feedback_content: string;
  resolved: boolean;
  resolved_at: string | null;
  ai_generated: boolean;
  author?: {
    name: string | null;
    image_url: string | null;
  } | null;
}

export interface ArticleContributor {
  id: string;
  article_id: string;
  author_id: string;
  contribution_type?: string;
  author?: {
    name: string | null;
    image_url: string | null;
  } | null;
}

export interface Comment {
  id: string;
  created_at: string | null;
  user_id: string;
  article_id: string;
  message: string;
  status: string;
  read: boolean | null;
  user?: {
    id: string;
    nickname: string | null;
  } | null;
  article?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface ArticlePendingActivity {
  articleId: string;
  unreadComments: number;
  unresolvedFeedback: number;
}