import { Author } from "./author";
import { Category } from "./category";

export type ArticleStatus = "draft" | "published" | "archived";

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
};

export interface JoinedArticle extends Omit<Article, "author_id" | "category_id"> {
  author: Author | null;
  category: Category | null;
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
}