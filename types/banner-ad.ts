import { Asset } from "./asset";
import { FeaturedStartup } from "./user-company";

export type BannerType = "square" | "vertical" | "horizontal";
export type BannerLocation = "sidebar" | "article_inline";

export interface BannerAd {
  id: string;
  title: string;
  image_url?: string; // Keeping for backward compatibility but image_ref will be used
  link_url: string;
  description?: string;
  location: BannerLocation;
  banner_type: BannerType;
  target_pages?: string; // JSON string of page slugs or regex
  target_categories?: string; // JSON string of category IDs
  is_active: boolean;
  display_order: number;
  start_date?: string;
  end_date?: string;
  max_views: number;
  current_views: number;
  current_clicks: number;
  created_at: string;
  updated_at: string;
  related_company?: string; // UUID of featured_startups
  image_ref?: string; // UUID of assets

  // Joined relations
  image_ref_asset?: Asset;
  related_company_featured?: FeaturedStartup;
}

export interface BannerAdFormData {
  title: string;
  image_url?: string;
  link_url: string;
  description?: string;
  location?: BannerLocation;
  banner_type?: BannerType;
  target_pages?: string;
  target_categories?: string;
  is_active?: boolean;
  display_order?: number;
  start_date?: string;
  end_date?: string;
  max_views?: number;
  current_views?: number;
  current_clicks?: number;
  related_company?: string;
  image_ref?: string;
}