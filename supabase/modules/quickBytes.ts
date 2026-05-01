import { supabaseAdminClient } from "../supabase";
import { QuickByte, QuickByteFormData } from "@/types/quickByte";

export const getQuickBytes = async (
  page = 0,
  limit = 20,
): Promise<QuickByte[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("quick_bytes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching quick bytes:", error);
      return [];
    }

    return data as QuickByte[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getQuickByteBySlug = async (slug: string): Promise<QuickByte | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("quick_bytes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching quick byte:", error);
      return null;
    }

    return data as QuickByte;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const createQuickByte = async (data: QuickByteFormData): Promise<QuickByte | null> => {
  try {
    const { data: quickByte, error } = await supabaseAdminClient
      .from("quick_bytes")
      .insert({
        title: data.title,
        content: data.content,
        link: data.link || null,
        summary: data.summary || null,
        status: data.status || "draft",
        lang: data.lang || "en",
        created_by: data.created_by || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating quick byte:", error);
      return null;
    }

    return quickByte as QuickByte;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateQuickByte = async (
  id: string,
  data: Partial<QuickByteFormData>,
): Promise<QuickByte | null> => {
  try {
    const { data: quickByte, error } = await supabaseAdminClient
      .from("quick_bytes")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quick byte:", error);
      return null;
    }

    return quickByte as QuickByte;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateQuickByteWithUser = async (
  id: string,
  data: Partial<QuickByteFormData>,
  userId: string,
): Promise<QuickByte | null> => {
  try {
    const { data: quickByte, error } = await supabaseAdminClient
      .from("quick_bytes")
      .update({
        ...data,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quick byte:", error);
      return null;
    }

    return quickByte as QuickByte;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteQuickByte = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("quick_bytes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting quick byte:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
