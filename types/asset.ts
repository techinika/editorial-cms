export type AssetType = "image" | "video" | "doc";

export interface Asset {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  url: string;
  type: AssetType;
  views: number;
  author_id: string | null;
  author?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface AssetFormData {
  name: string;
  url: string;
  type: AssetType;
  author_id?: string | null;
}

export interface AssetUsage {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    field: string;
  }>;
}
