export interface Category {
  id: string;
  created_at: string;
  lang: string;
  name: string;
  description: string | null;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  lang?: string;
}