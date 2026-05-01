export type Query = {
  id: number;
  created_at: string;
  email: string;
  message: string | null;
  subject: string | null;
  name: string | null;
  feedback: string | null;
};

export type QueryFilter = {
  feedback?: string;
};

export type QueryFormData = {
  email: string;
  message: string;
  subject?: string;
  name?: string;
};
