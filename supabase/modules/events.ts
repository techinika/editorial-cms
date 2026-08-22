import { EventFormData, Event } from "@/types/event";
import { getSupabase } from "../supabase";

export const createEvent = async (
  data: EventFormData,
): Promise<Event | null> => {
  try {
    const { data: event, error } = await getSupabase()
      .from("events")
      .insert(data)
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
