export interface CampaignArticle {
  id: string;
  campaign_id: string;
  article_id: string;
  position: number;
  created_at: string;
}

export interface CampaignArticleWithArticle extends CampaignArticle {
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    image: string | null;
    status: string | null;
  };
}

export interface Campaign {
  id: string;
  subject: string;
  body: string;
  total_sent: number;
  total_failed: number;
  total_recipients: number;
  open_rate?: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
  updated_at: string;
  articles?: CampaignArticleWithArticle[];
}

export interface CampaignFormData {
  subject: string;
  body: string;
  status?: 'draft' | 'sending' | 'sent' | 'failed';
  articleIds?: string[];
}
