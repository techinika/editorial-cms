export type UserCompanyActiveStatus = "confirmation_pending" | "pending" | "accepted" | "rejected";

export interface UserCompany {
  id: string;
  user_id: string | null;
  company_id: string | null;
  role: string | null;
  note: string | null;
  created_at: string | null;
  status: UserCompanyActiveStatus;
  added_by: string | null;
  verified: boolean;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  addedByUser?: {
    id: string;
    name: string;
  } | null;
}

export interface FeaturedStartup {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
}