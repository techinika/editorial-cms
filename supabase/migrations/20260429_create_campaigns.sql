-- Create campaigns table for tracking email campaign history
create table public.campaigns (
  id uuid not null default gen_random_uuid (),
  subject text not null,
  body text not null,
  total_sent integer not null default 0,
  total_failed integer not null default 0,
  total_recipients integer not null default 0,
  status text not null default 'draft'::text,
  sent_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint campaigns_pkey primary key (id),
  constraint campaigns_status_check check (
    status = any (array['draft'::text, 'sending'::text, 'sent'::text, 'failed'::text])
  )
) TABLESPACE pg_default;

create index IF not exists idx_campaigns_status on public.campaigns using btree (status) TABLESPACE pg_default;
create index IF not exists idx_campaigns_created_at on public.campaigns using btree (created_at desc) TABLESPACE pg_default;
