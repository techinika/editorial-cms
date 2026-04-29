import { BannerAd, BannerAdFormData } from "@/types/banner-ad";
import { supabaseAdminClient } from "../supabase";

const bannerAdSelect = `
  *,
  image_ref_asset:assets!image_ref (id, name, url, type, views, created_at, updated_at),
  related_company_featured:featured_startups!related_company (id, name, description, logo_url, website, created_at)
`;

export const getBannerAds = async (
  page = 0,
  limit = 12,
): Promise<BannerAd[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("banner_ads")
      .select(bannerAdSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching banner ads:", error);
      return [];
    }

    return data as unknown as BannerAd[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getBannerAdById = async (
  id: string,
): Promise<BannerAd | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("banner_ads")
      .select(bannerAdSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching banner ad:", error);
      return null;
    }

    return data as unknown as BannerAd;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const createBannerAd = async (
  data: BannerAdFormData,
): Promise<BannerAd | null> => {
  try {
    const imageRef = data.image_ref && data.image_ref !== "" ? data.image_ref : null;
    const relatedCompany = data.related_company && data.related_company !== "" ? data.related_company : null;

    const { data: bannerAd, error } = await supabaseAdminClient
      .from("banner_ads")
      .insert({
        title: data.title,
        image_url: data.image_url || null, // Keep for backward compatibility? But we'll use image_ref
        link_url: data.link_url,
        description: data.description || null,
        location: data.location || 'sidebar',
        banner_type: data.banner_type || 'square',
        target_pages: data.target_pages || null,
        target_categories: data.target_categories || null,
        is_active: data.is_active ?? true,
        display_order: data.display_order ?? 0,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        max_views: data.max_views ?? 0,
        current_views: data.current_views ?? 0,
        current_clicks: data.current_clicks ?? 0,
        image_ref: imageRef,
        related_company: relatedCompany,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating banner ad:", error);
      return null;
    }

    return bannerAd as BannerAd;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateBannerAd = async (
  id: string,
  data: Partial<BannerAdFormData>,
): Promise<BannerAd | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    // Convert empty strings to null for UUID fields
    if (updateData.image_ref === "") {
      updateData.image_ref = null;
    }
    if (updateData.related_company === "") {
      updateData.related_company = null;
    }

    // Handle timestamps if needed
    // if (data.is_active === false) { ... }

    const { data: bannerAd, error } = await supabaseAdminClient
      .from("banner_ads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating banner ad:", error);
      return null;
    }

    return bannerAd as BannerAd;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteBannerAd = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("banner_ads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting banner ad:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};