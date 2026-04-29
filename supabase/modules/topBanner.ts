import { TopBanner, TopBannerFormData } from "@/types/top-banner";
import { supabaseAdminClient } from "../supabase";

const topBannerSelect = `
  *
`;

export const getTopBanners = async (
  page = 0,
  limit = 20,
): Promise<TopBanner[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("top_banner")
      .select(topBannerSelect)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching top banners:", error);
      return [];
    }

    return data as unknown as TopBanner[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getTopBannerById = async (
  id: string,
): Promise<TopBanner | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("top_banner")
      .select(topBannerSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching top banner:", error);
      return null;
    }

    return data as unknown as TopBanner;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const createTopBanner = async (
  data: TopBannerFormData,
): Promise<TopBanner | null> => {
  try {
    const { data: banner, error } = await supabaseAdminClient
      .from("top_banner")
      .insert({
        title: data.title,
        content: data.content,
        link_url: data.link_url || null,
        link_text: data.link_text || null,
        background_color: data.background_color || "#38b6ff",
        text_color: data.text_color || "#FFFFFF",
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active ?? true,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating top banner:", error);
      return null;
    }

    return banner as TopBanner;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateTopBanner = async (
  id: string,
  data: Partial<TopBannerFormData>,
): Promise<TopBanner | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    const { data: banner, error } = await supabaseAdminClient
      .from("top_banner")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating top banner:", error);
      return null;
    }

    return banner as TopBanner;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteTopBanner = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("top_banner")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting top banner:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getActiveTopBanners = async (): Promise<TopBanner[]> => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdminClient
      .from("top_banner")
      .select(topBannerSelect)
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching active top banners:", error);
      return [];
    }

    return data as unknown as TopBanner[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};
