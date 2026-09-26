-- Article ideas / editorial leads, and partners.
--
-- Two new CMS-only tables plus two columns on `articles`.
--
-- RLS note: both new tables are enabled with NO anon or authenticated policy,
-- which means the public anon key cannot read or write them at all — only
-- service_role (the CMS's server routes) can. This is deliberate and matches
-- the reasoning in techinika-workers/api-worker/migrations: an idea carries a
-- lead's personal contact details and unpublished editorial strategy, and the
-- blog never needs to read any of it. If you later add a policy, check what
-- the anon key can reach first.

-- ── partners ────────────────────────────────────────────────────────────────
-- Organisations the publication works with: sponsors, clients, and sources of
-- commissioned or partner content. Referenced by both articles and ideas so
-- "this came from a partner" is answerable either way round.
create table if not exists public.partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null,
  description   text,
  website       text,
  logo_url      text,
  contact_name  text,
  contact_email text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint partners_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint partners_slug_length check (char_length(slug) between 1 and 80),
  constraint partners_name_length check (char_length(name) between 1 and 200),
  -- An inactive partner is kept for history: articles and ideas still point at
  -- it, it just stops appearing in pickers.
  constraint partners_contact_email_format
    check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- Case-insensitive uniqueness: two rows differing only in capitalisation would
-- render as two distinct partners in a picker but be the same partner to a reader.
create unique index if not exists partners_slug_key on public.partners (lower(slug));
create unique index if not exists partners_name_key on public.partners (lower(name));
create index if not exists partners_active_idx on public.partners (is_active);

-- ── article_ideas ───────────────────────────────────────────────────────────
-- The editorial pipeline. A lead arrives, an admin assigns it to an author, the
-- author works it, and eventually converts it into a real row in `articles`.
create table if not exists public.article_ideas (
  id                 uuid primary key default gen_random_uuid(),

  -- The pitch itself, short enough to scan in a list.
  title              text not null,

  -- Who brought it in, and how to reach them. `lead_name` is a person; the
  -- contact columns are optional because plenty of leads come from a company's
  -- comms team with no named contact.
  lead_name          text,
  contact_email      text,
  contact_phone      text,

  -- The brief: the angle, why it matters, who it's for. This is what the
  -- author actually writes from, and it is seeded into the article body on
  -- conversion so they don't start from a blank page.
  concept            text,

  -- Everything else: notes, links, deadlines, legal considerations.
  notes              text,

  -- Where the lead came from. Doubles as the source material for
  -- /api/generate-article, which is why it is a first-class column.
  source_url         text,

  -- Pipeline stage. The five the editorial team asked for, plus two terminal
  -- states a pipeline cannot work without:
  --   published  — the linked article is live
  --   declined   -- pitched and passed, kept so the same lead isn't re-pitched
  status             text not null default 'idea'
                     check (status in ('idea', 'draft', 'in_progress',
                                       'pending_publishing', 'publishing',
                                       'published', 'declined')),

  -- The author who owns this. Nullable: an unassigned idea is a valid state
  -- (that is what "idea" means), but an idea cannot be *converted* without one,
  -- because the article has to inherit the assignee as its author.
  --
  -- authors.id is the auth-platform user id (this is how app/edit/[articleId]
  -- decides ownership), so "assigned to me" is a plain id comparison.
  assigned_author_id uuid references public.authors (id) on delete set null,

  -- Set by the convert endpoint. on delete set null so deleting a draft
  -- article doesn't delete the idea that produced it.
  article_id         uuid references public.articles (id) on delete set null,
  converted_at       timestamptz,

  -- Editorial classification, carried onto the article on conversion.
  content_type       text not null default 'editorial'
                     check (content_type in ('editorial', 'commercial')),
  partner_id         uuid references public.partners (id) on delete set null,

  -- Free-text record of who logged it, since the auth platform's user id does
  -- not exist as a row in any table we can foreign-key.
  created_by_name    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint article_ideas_title_length check (char_length(title) between 1 and 300),
  constraint article_ideas_contact_email_format
    check (contact_email is null or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- The list view filters and groups by stage, and the board shows one column per
-- stage, so this is the hot path.
create index if not exists article_ideas_status_idx on public.article_ideas (status);
create index if not exists article_ideas_assigned_idx
  on public.article_ideas (assigned_author_id)
  where assigned_author_id is not null;
create index if not exists article_ideas_created_at_idx
  on public.article_ideas (created_at desc);

-- At most one idea may claim a given article.
--
-- This is NOT the "one article per idea" guarantee — a unique index on
-- article_id says nothing about how many articles can point back at a single
-- idea, because each article has its own id. The guarantee in that direction
-- comes from the conversion claim in the `converting_at` column below.
create unique index if not exists article_ideas_article_key
  on public.article_ideas (article_id)
  where article_id is not null;

-- Claim token for the article→idea conversion.
--
-- Converting a pitch is two writes: create a draft in `articles`, then link it
-- back here. Doing those without a lock lets a double-clicked button, or two
-- tabs, create two drafts from one pitch before either link lands.
--
-- The convert endpoint claims the idea first with a single conditional
-- statement —
--
--   update article_ideas set converting_at = now()
--    where id = ? and article_id is null and converting_at is null
--
-- — which Postgres runs under a row lock, so exactly one caller matches and the
-- others come back with zero rows. The winner then inserts the article and
-- writes article_id, and releases the claim; on failure it clears converting_at
-- so the idea isn't stuck.
--
-- A crash between those steps would leave the claim set, so a claim older than
-- a few minutes may be taken over by a later attempt.
alter table public.article_ideas
  add column if not exists converting_at timestamptz;

create index if not exists article_ideas_converting_idx
  on public.article_ideas (converting_at)
  where converting_at is not null;

-- Full-text search over the pitch and the brief, for the ideas search box.
create index if not exists article_ideas_search_idx
  on public.article_ideas
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(concept, '')));

-- ── articles: editorial classification and partner ──────────────────────────
-- Deliberately separate from the existing `sponsored` boolean, which stays
-- exactly as it is: it is a public flag the blog renders as a "Sponsored"
-- badge. `content_type` is the internal editorial classification, and
-- `partner_id` records who the piece came from — a partner article can be
-- editorial in tone, and a sponsored one need not have a partner on file.
-- Reconciling the two is an editorial decision, not a schema one.
alter table public.articles
  add column if not exists content_type text
    check (content_type is null or content_type in ('editorial', 'commercial')),
  add column if not exists partner_id uuid
    references public.partners (id) on delete set null;

-- Every existing piece of writing is editorial: the publication only ever
-- published its own journalism before this column existed. Backfilling rather
-- than leaving it null means `content_type` can be a real NOT NULL invariant
-- and the CMS doesn't have to guess what a null means. Re-running the
-- backfill is a no-op, so this is safe to apply to a table that already has
-- commercial rows.
update public.articles
   set content_type = 'editorial'
 where content_type is null;

alter table public.articles
  alter column content_type set default 'editorial',
  alter column content_type set not null;

alter table public.articles
  drop constraint if exists articles_content_type_check;
alter table public.articles
  add constraint articles_content_type_check
    check (content_type in ('editorial', 'commercial'));

create index if not exists articles_partner_idx
  on public.articles (partner_id)
  where partner_id is not null;

-- A commercial piece with no partner on file is a legitimate state (house
-- commercial), so this is not a constraint — but it is worth being able to ask.
create index if not exists articles_commercial_idx
  on public.articles (content_type)
  where content_type = 'commercial';

-- ── RLS and grants ───────────────────────────────────────────────────────────
alter table public.partners      enable row level security;
alter table public.article_ideas enable row level security;
-- No policies: anon and authenticated get nothing, service_role bypasses RLS.
-- The CMS reaches both through its server routes on the service-role key,
-- which is how /api/videos already works.

-- RLS with no policy already returns zero rows, but relying on that alone
-- means a later `alter table ... disable row level security` — or a table
-- recreated from this definition in a dump — silently re-exposes every lead's
-- contact details. Take the grants away too, so the anon key is refused on
-- both counts. This is the same reasoning as the revoke in
-- rls_harden_sensitive_tables.sql, and deliberately stricter than it: those
-- tables keep anon SELECT for public reads, these never had one.
revoke all on public.partners     from anon, authenticated;
revoke all on public.article_ideas from anon, authenticated;

-- The CMS's server routes use service_role, which bypasses RLS. Granted
-- explicitly so this doesn't depend on Supabase's default privileges having
-- been applied to the table's owner.
grant all on public.partners     to service_role;
grant all on public.article_ideas to service_role;
