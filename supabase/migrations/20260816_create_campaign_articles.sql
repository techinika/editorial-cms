create table public.campaign_articles (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null,
  article_id uuid not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint campaign_articles_pkey primary key (id),
  constraint campaign_articles_campaign_id_fkey foreign key (campaign_id) references campaigns (id) on delete cascade,
  constraint campaign_articles_article_id_fkey foreign key (article_id) references articles (id) on delete cascade,
  constraint campaign_articles_unique unique (campaign_id, article_id)
);

create index idx_campaign_articles_campaign on public.campaign_articles (campaign_id);
create index idx_campaign_articles_article on public.campaign_articles (article_id);
