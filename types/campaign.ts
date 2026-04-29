export interface Campaign {
  id: string;
  subject: string;
  body: string;
  total_sent: number;
  total_failed: number;
  total_recipients: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignFormData {
  subject: string;
  body: string;
  status?: 'draft' | 'sending' | 'sent' | 'failed';
}
