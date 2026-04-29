export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  subscribed: boolean;
}

export interface SubscriberFormData {
  email: string;
  subscribed?: boolean;
}
