export interface CompanyImage {
  id: string;
  url: string;
}

export interface CompanyOption {
  id: string;
  name: string;
  slug: string | null;
  image_ref: string | null;
  image: CompanyImage | null;
  description: string | null;
  industry: string | null;
}

export interface MatchedCompany {
  id: string;
  name: string;
  slug: string | null;
  image_ref: string | null;
  image: CompanyImage | null;
  description: string | null;
  industry: string | null;
}

export interface ArticleCompanyMatch {
  id: number;
  article_id: string;
  company_id: string;
  created_at: string | null;
  company: MatchedCompany | null;
}

export interface CompanySuggestion {
  company_id: string;
  name?: string;
  confidence: number;
  reason: string;
}
