/**
 * Article ideas (editorial leads) and partners.
 *
 * These types describe the CMS's editorial pipeline. `article_ideas` is
 * admin-only: nothing in this file is ever read with the anon key.
 */

export type IdeaStatus =
  | "idea"
  | "draft"
  | "in_progress"
  | "pending_publishing"
  | "publishing"
  | "published"
  | "declined";

/** How a piece relates to the business: our own journalism, or paid work. */
export type ContentType = "editorial" | "commercial";

export interface ArticleIdea {
  id: string;
  title: string;
  lead_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  concept: string | null;
  notes: string | null;
  source_url: string | null;
  status: IdeaStatus;
  assigned_author_id: string | null;
  article_id: string | null;
  converted_at: string | null;
  content_type: ContentType;
  partner_id: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;

  /** Joined for the list view so rows render without a second round trip. */
  assigned_author: {
    id: string;
    name: string;
    username: string | null;
    image_url: string | null;
  } | null;
  partner: { id: string; name: string; slug: string } | null;
  article: { id: string; title: string; slug: string; status: string } | null;
}

export interface ArticleIdeaInput {
  title: string;
  lead_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  concept?: string | null;
  notes?: string | null;
  source_url?: string | null;
  status?: IdeaStatus;
  assigned_author_id?: string | null;
  content_type?: ContentType;
  partner_id?: string | null;
  created_by_name?: string | null;
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Present on the articles list, where partners are joined in. */
  article_count?: number;
}

export interface PartnerInput {
  name: string;
  slug?: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

/**
 * The four columns a partner dropdown needs.
 *
 * Deliberately smaller than Partner: an author tagging their own article needs
 * to name a partner, not read that partner's contact email or internal notes,
 * so the picker endpoint projects only this.
 */
export interface PartnerOption {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

/** An author an idea can be assigned to. */
export interface AssignableAuthor {
  id: string;
  name: string;
  username: string | null;
  image_url: string | null;
}
