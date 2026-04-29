import { Subscriber, SubscriberFormData } from "@/types/subscriber";
import { supabaseAdminClient } from "../supabase";

const subscriberSelect = `
  *
`;

export const getSubscribers = async (
  page = 0,
  limit = 20,
): Promise<Subscriber[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("subscribers")
      .select(subscriberSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching subscribers:", error);
      return [];
    }

    return data as unknown as Subscriber[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getSubscriberById = async (
  id: string,
): Promise<Subscriber | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("subscribers")
      .select(subscriberSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching subscriber:", error);
      return null;
    }

    return data as unknown as Subscriber;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const searchSubscribers = async (
  query: string,
): Promise<Subscriber[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("subscribers")
      .select(subscriberSelect)
      .ilike("email", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching subscribers:", error);
      return [];
    }

    return data as unknown as Subscriber[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const createSubscriber = async (
  data: SubscriberFormData,
): Promise<Subscriber | null> => {
  try {
    const { data: subscriber, error } = await supabaseAdminClient
      .from("subscribers")
      .insert({
        email: data.email,
        subscribed: data.subscribed ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscriber:", error);
      return null;
    }

    return subscriber as Subscriber;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateSubscriber = async (
  id: string,
  data: Partial<SubscriberFormData>,
): Promise<Subscriber | null> => {
  try {
    const { data: subscriber, error } = await supabaseAdminClient
      .from("subscribers")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscriber:", error);
      return null;
    }

    return subscriber as Subscriber;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteSubscriber = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscriber:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getActiveSubscribers = async (): Promise<Subscriber[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("subscribers")
      .select(subscriberSelect)
      .eq("subscribed", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching active subscribers:", error);
      return [];
    }

    return data as unknown as Subscriber[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getSubscribersCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabaseAdminClient
      .from("subscribers")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error counting subscribers:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};
