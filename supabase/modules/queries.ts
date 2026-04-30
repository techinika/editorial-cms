import { supabaseAdminClient } from "../supabase";
import { Query, QueryFilter } from "@/types/query";

export const createQuery = async (data: {
  email: string;
  message: string;
  subject?: string;
  name?: string;
}): Promise<Query | null> => {
  try {
    const { data: query, error } = await supabaseAdminClient
      .from("queries")
      .insert({
        email: data.email,
        message: data.message,
        subject: data.subject || null,
        name: data.name || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating query:", error);
      return null;
    }

    return query as Query;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getQueries = async (
  page = 0,
  limit = 20,
  filter?: QueryFilter,
): Promise<Query[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    let query = supabaseAdminClient
      .from("querries")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filter?.feedback) {
      query = query.eq("feedback", filter.feedback);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching querries:", error);
      return [];
    }

    return data as Query[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const updateQueryFeedback = async (
  id: number,
  feedback: string,
): Promise<Query | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("querries")
      .update({ feedback })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating query:", error);
      return null;
    }

    return data as Query;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteQuery = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("querries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting query:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
