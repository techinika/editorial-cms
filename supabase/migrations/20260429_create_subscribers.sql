-- Create subscribers table for managing email subscribers
create table public.subscribers (
  id uuid not null default gen_random_uuid (),
  email character varying(255) not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  subscribed boolean null default true,
  constraint subscribers_pkey primary key (id),
  constraint subscribers_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_subscribers_subscribed on public.subscribers using btree (subscribed) TABLESPACE pg_default;
create index IF not exists idx_subscribers_created_at on public.subscribers using btree (created_at) TABLESPACE pg_default;
