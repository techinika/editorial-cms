-- Create queries table for contact form submissions
CREATE TABLE public.queries (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL,
  message TEXT,
  subject TEXT,
  name TEXT,
  feedback VARCHAR DEFAULT 'pending'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_queries_feedback ON public.queries(feedback);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON public.queries(created_at DESC);
