<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

This is the error I get while trying to update the article it says unable to save blocks because no blocks field in articles table. Typically html content is saved in content field. So, should i add another field "blocks" in table? Or will we use content to also keep blocks?

In th page /ads, while we are managing the banner ads, let us also add another functionality to manage top sticky banner. create table public.top_banner (
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



On /ads page, everything should be real-time, after updating anything, changes should appear without needing to refresh. Also, filters are real time, after filtering once, when I get back to all, I get a page with message, no banner ads.