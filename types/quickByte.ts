export interface QuickByte {
  id: string;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  lang: string;
  title: string;
  content: string;
  link?: string | null;
  slug: string;
  summary?: string | null;
  status: 'draft' | 'published';
}

export interface QuickByteFormData {
  lang?: string;
  title: string;
  content: string;
  link?: string | null;
  summary?: string | null;
  status?: 'draft' | 'published';
  created_by?: string;
}
