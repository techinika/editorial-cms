create table public.campaign_recipients (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  campaign_id uuid not null,
  email text not null,
  status text not null default 'pending'::text,
  sent_at timestamp with time zone null,
  error_message text null,
  constraint campaign_recipients_pkey primary key (id),
  constraint campaign_recipients_campaign_id_fkey foreign key (campaign_id) references campaigns (id) on delete cascade,
  constraint campaign_recipients_status_check check (status in ('pending', 'sent', 'failed'))
);

create index idx_campaign_recipients_campaign_id on public.campaign_recipients (campaign_id);
create index idx_campaign_recipients_status on public.campaign_recipients (status);
