import { getSupabase } from "../supabase";
import { QuickByte, QuickByteFormData } from "@/types/quickByte";

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const getQuickBytes = async (
  page = 0,
  limit = 20,
): Promise<QuickByte[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await getSupabase()
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
    const { data, error } = await getSupabase()
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
    const slug = data.title ? generateSlug(data.title) : "";
    const { data: quickByte, error } = await getSupabase()
      .from("quick_bytes")
      .insert({
        title: data.title,
        slug,
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
    const { data: quickByte, error } = await getSupabase()
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
    const { data: quickByte, error } = await getSupabase()
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
    const { error } = await getSupabase()
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

export const searchQuickBytes = async (query: string): Promise<QuickByte[]> => {
  try {
    const { data, error } = await getSupabase()
      .from("quick_bytes")
      .select("*")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching quick bytes:", error);
      return [];
    }

    return (data || []) as QuickByte[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getQuickBytesCount = async (): Promise<number> => {
  try {
    const { count, error } = await getSupabase()
      .from("quick_bytes")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Error counting quick bytes:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};

export const getQuickBytesByStatus = async (
  status: "draft" | "published",
  page = 0,
  limit = 20,
): Promise<QuickByte[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await getSupabase()
      .from("quick_bytes")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching quick bytes by status:", error);
      return [];
    }

    return (data || []) as QuickByte[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};
