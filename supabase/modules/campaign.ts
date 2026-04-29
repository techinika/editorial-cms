import { Campaign, CampaignFormData } from "@/types/campaign";
import { supabaseAdminClient } from "../supabase";

const campaignSelect = `
  *
`;

export const getCampaigns = async (
  page = 0,
  limit = 20,
): Promise<Campaign[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("campaigns")
      .select(campaignSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }

    return data as unknown as Campaign[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getCampaignById = async (
  id: string,
): Promise<Campaign | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("campaigns")
      .select(campaignSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching campaign:", error);
      return null;
    }

    return data as unknown as Campaign;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const createCampaign = async (
  data: CampaignFormData,
): Promise<Campaign | null> => {
  try {
    const { data: campaign, error } = await supabaseAdminClient
      .from("campaigns")
      .insert({
        subject: data.subject,
        body: data.body,
        total_sent: 0,
        total_failed: 0,
        total_recipients: 0,
        status: data.status || 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return null;
    }

    return campaign as Campaign;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateCampaign = async (
  id: string,
  data: Partial<CampaignFormData>,
): Promise<Campaign | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    const { data: campaign, error } = await supabaseAdminClient
      .from("campaigns")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating campaign:", error);
      return null;
    }

    return campaign as Campaign;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const deleteCampaign = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const updateCampaignStats = async (
  id: string,
  sent: number,
  failed: number,
  recipients: number,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("campaigns")
      .update({
        total_sent: sent,
        total_failed: failed,
        total_recipients: recipients,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating campaign stats:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getCampaignsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabaseAdminClient
      .from("campaigns")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error counting campaigns:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return 0;
  }
};
