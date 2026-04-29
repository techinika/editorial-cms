export interface TopBanner {
  id: string;
  title: string;
  content: string;
  link_url?: string;
  link_text?: string;
  background_color?: string;
  text_color?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TopBannerFormData {
  title: string;
  content: string;
  link_url?: string;
  link_text?: string;
  background_color?: string;
  text_color?: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  display_order?: number;
}
