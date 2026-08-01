import { getSupabase } from "../supabase";

export interface CampaignRecipient {
  id: string;
  created_at: string;
  campaign_id: string;
  email: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  error_message: string | null;
}

export const createRecipients = async (
  campaignId: string,
  emails: string[],
): Promise<number> => {
  const rows = emails.map((email) => ({
    campaign_id: campaignId,
    email,
    status: "pending" as const,
  }));

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await getSupabase()
      .from("campaign_recipients")
      .insert(batch);

    if (error) {
      console.error("Error inserting recipients:", error);
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
};

export const getPendingRecipients = async (
  campaignId: string,
  limit = 50,
): Promise<CampaignRecipient[]> => {
  const { data, error } = await getSupabase()
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching pending recipients:", error);
    return [];
  }

  return (data || []) as CampaignRecipient[];
};

export const markRecipientSent = async (id: string): Promise<void> => {
  const { error } = await getSupabase()
    .from("campaign_recipients")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error marking recipient as sent:", error);
  }
};

export const markRecipientFailed = async (
  id: string,
  errorMessage: string,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("campaign_recipients")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", id);

  if (error) {
    console.error("Error marking recipient as failed:", error);
  }
};

export const getRecipientCounts = async (
  campaignId: string,
): Promise<{ pending: number; sent: number; failed: number }> => {
  const [pending, sent, failed] = await Promise.all([
    getSupabase()
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "pending"),
    getSupabase()
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "sent"),
    getSupabase()
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "failed"),
  ]);

  return {
    pending: pending.count || 0,
    sent: sent.count || 0,
    failed: failed.count || 0,
  };
};
