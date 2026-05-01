import { supabaseAdminClient } from "../supabase";

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

export type TopBannerFormData = {
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
};

export const getTopBanners = async (): Promise<TopBanner[]> => {
  const { data, error } = await supabaseAdminClient
    .from("top_banner")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching top banners:", error);
    return [];
  }

  return data || [];
};

export const getActiveTopBanners = async (): Promise<TopBanner[]> => {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdminClient
    .from("top_banner")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching active top banners:", error);
    return [];
  }

  return data || [];
};

export const createTopBanner = async (banner: TopBannerFormData): Promise<TopBanner | null> => {
  const { data, error } = await supabaseAdminClient
    .from("top_banner")
    .insert([banner])
    .select()
    .single();

  if (error) {
    console.error("Error creating top banner:", error);
    return null;
  }

  return data;
};

export const updateTopBanner = async (id: string, updates: Partial<TopBannerFormData>): Promise<TopBanner | null> => {
  const { data, error } = await supabaseAdminClient
    .from("top_banner")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating top banner:", error);
    return null;
  }

  return data;
};

export const deleteTopBanner = async (id: string): Promise<boolean> => {
  const { error } = await supabaseAdminClient
    .from("top_banner")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting top banner:", error);
    return false;
  }

  return true;
};
