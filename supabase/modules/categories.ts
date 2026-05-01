import { Category } from "@/types/category";
import { supabaseAdminClient } from "../supabase";

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data as Category[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createCategory = async (
  name: string,
  description?: string,
  lang = "english",
): Promise<Category | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("categories")
      .insert({
        name,
        description: description || null,
        lang,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return null;
    }

    return data as Category;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateCategory = async (
  id: string,
  data: { name?: string; description?: string },
): Promise<Category | null> => {
  try {
    const { data: category, error } = await supabaseAdminClient
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return null;
    }

    return category as Category;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};
