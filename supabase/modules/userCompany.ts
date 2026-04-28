import { UserCompany, FeaturedStartup } from "@/types/user-company";
import { supabaseAdminClient } from "../supabase";

const userCompanySelect = `
  *,
  company:featured_startups (id, name, slug, logo_url),
  addedByUser:authors!added_by (id, name)
`;

export const getUserCompaniesByUser = async (
  userId: string,
): Promise<UserCompany[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("user_company")
      .select(userCompanySelect)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user companies:", error);
      return [];
    }

    return data as unknown as UserCompany[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getCompanyRequests = async (): Promise<UserCompany[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("user_company")
      .select(userCompanySelect)
      .in("status", ["confirmation_pending", "pending"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching company requests:", error);
      return [];
    }

    return data as unknown as UserCompany[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getVerifiedUserCompanies = async (): Promise<UserCompany[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("user_company")
      .select(userCompanySelect)
      .eq("status", "accepted")
      .eq("verified", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching verified companies:", error);
      return [];
    }

    return data as unknown as UserCompany[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const approveUserCompany = async (
  userCompanyId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("user_company")
      .update({
        status: "accepted",
        verified: true,
      })
      .eq("id", userCompanyId);

    if (error) {
      console.error("Error approving user company:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const rejectUserCompany = async (
  userCompanyId: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("user_company")
      .update({
        status: "rejected",
      })
      .eq("id", userCompanyId);

    if (error) {
      console.error("Error rejecting user company:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const addUserCompany = async (
  userId: string,
  companyId: string,
  role: string,
  addedBy: string,
): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient.from("user_company").insert({
      user_id: userId,
      company_id: companyId,
      role,
      added_by: addedBy,
      status: "pending",
      verified: false,
    });

    if (error) {
      console.error("Error adding user company:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getFeaturedStartups = async (): Promise<FeaturedStartup[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("featured_startups")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching startups:", error);
      return [];
    }

    return data as unknown as FeaturedStartup[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};
