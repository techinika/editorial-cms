-- Create top_banner table for managing top sticky banners
create table public.top_banner (
  id uuid not null default gen_random_uuid (),
  title text not null,
  content text not null,
  link_url text null,
  link_text text null,
  background_color text null default '#38b6ff'::text,
  text_color text null default '#FFFFFF'::text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean null default true,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint top_banner_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_top_banner_dates on public.top_banner using btree (start_date, end_date) TABLESPACE pg_default;

-- Add comment to table
comment on table public.top_banner is 'Table for managing top sticky banner advertisements';
