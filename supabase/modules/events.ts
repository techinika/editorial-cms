import { EventFormData, Event } from "@/types/event";
import { getSupabase } from "../supabase";
import { sanitizeHtml } from "@/lib/content-parser";

export const createEvent = async (
  data: EventFormData,
): Promise<Event | null> => {
  try {
    const { data: event, error } = await getSupabase()
      .from("events")
      .insert({
        ...data,
        full_description: data.full_description
          ? sanitizeHtml(data.full_description)
          : null,
      })
      .select("id, title, slug")
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return null;
    }

    return event as Event;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};
