# Blog CMS

A content management system for blogs built with Next.js 16, Supabase, and Tailwind CSS.

## Features

### Authentication
- External auth integration via `NEXT_PUBLIC_AUTH_URL`
- Role-based access (author and admin roles)
- Server-side auth checks on protected API routes and server actions (`checkAuthStatusServer()` + `requireAuthor()`)
- User info displayed in header with profile picture
- Admin users have additional privileges (change article ownership, manage contributors)

### Article Management
- View and manage articles on main dashboard
- Search articles by title, summary, or tags
- Pagination for article listings
- Filter by status (Draft, Published, Cancelled) and category
- Real-time updates via Supabase subscriptions

### Article Actions (on card hover)
- **Share** - Copy article URL to clipboard
- **Edit** - Navigate to `/edit/[articleId]`
- **Unpublish** - Move published article back to draft with optional feedback
- **Delete** - Delete article with confirmation modal

### Rich Text Editor (Create/Edit Article)
- **Tiptap Editor** with full formatting support:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Blockquotes and code blocks
  - Links with custom URL input
  - **Image upload** via the uploads worker (Cloudflare R2)
  - **Video upload** via the uploads worker (Cloudflare R2)
- **Real-time word count** and auto-calculated read time
- **Live preview mode** to see article before publishing
- **Save draft** to Supabase (creates or updates article)
- **Publish** with validation (requires title and content)
- **Category selection** from Supabase database
- **Featured image upload** via the uploads worker
- **SEO description** field with character count hint
- **Tags input** for article categorization
- **Inline asset editing** (alt text, caption, swap, remove)

### Feedback System (/edit/[articleId])
- Users can add feedback comments on articles
- Authors must resolve all feedback before publishing
- Feedback shows author name, timestamp, and resolved status
- Owner/Admin can mark feedback as resolved
- **Preview mode**: Non-owners can view and comment but cannot edit

### Team Management (/edit/[articleId])
- **Admin users** can:
  - Change the article writer (owner)
  - Add contributors to articles
  - Remove contributors
- **Authors** can view team but cannot modify ownership
- Contributors table stores article-author relationships

### Assets Management (/assets)
- Upload images, videos, and documents via the uploads worker (Cloudflare R2)
- Search and filter assets by type
- Assign assets as article thumbnails or author profile images
- View which articles use a given asset
- Edit asset metadata (name, type, URL)

### Ads Management (/ads)
- **Banner Ads**: Create, edit, delete banner ads with targeting
  - Location (sidebar, article inline)
  - Banner type (square, vertical, horizontal)
  - Target pages and categories
  - Date range scheduling
  - Max views limit
  - Active/inactive toggle
- **Top Banners**: Create, edit, delete sticky top banners
  - Custom background and text colors
  - Date range scheduling
  - Live preview
  - Active/inactive toggle
- Company association for ads
- Real-time updates

### Subscribers (/subscribers)
- View all subscribers in table format
- Add/edit/delete subscribers
- Bulk email to all active subscribers
- Download subscribers as CSV (email, status, subscribed date)
- Import subscribers from CSV file with duplicate detection

### Categories Management (/categories)
- View all categories in table format
- Add new category with name and description
- Edit existing category
- Delete category with confirmation modal
- Search categories by name or description

### Quick Bytes (/bytes)
- Short-form content with rich text editor
- Language support (en, es, fr, de, hi)
- Draft/published status filtering
- External link support
- Summary field
- Auto-generated slug from title
- Search across title, content, and summary

### Comments Management (/comments)
- View all comments across articles
- Approve/delete comments
- Filter by status (pending, approved)
- Search comments

### Campaigns (/campaigns)
- Create email campaigns with WYSIWYG editor
- Save as draft or send immediately
- Async email queue for 10k+ subscribers (prevents timeouts)
- Batch processing with progress tracking
- Campaign stats: sent, failed, total recipients
- Email templates with variable support
- Campaign analytics

### Stats Dashboard (/stats)
- Lifetime KPIs: total published, total views, average views per article
- Views trend chart with 7/14/30/90 day selectable ranges
- Calendar date picker to select a specific date
- Period-filterable stats (day, week, month, year)
- Per-article bar chart and table for selected period
- Summary cards: article count, total views, average views
- Status breakdown (draft, published, cancelled)
- Articles listing with tab navigation

### UI/UX
- Primary color: #3182ce (blue-500)
- Less rounded edges (rounded-md)
- Modern, clean design with gradient backgrounds
- Smooth transitions and hover effects
- Backdrop blur effects
- Responsive sidebar layout
- Custom form inputs with focus states
- Accessible modals with focus trap and ARIA roles
- Toast notifications for user feedback
- Error boundary for graceful error handling

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Editor**: Tiptap v3 with extensions (Link, Image, Underline, Strike, Placeholder)
- **Storage**: Supabase (PostgreSQL) + uploads worker (Cloudflare R2)
- **Authentication**: External auth app via REST API
- **Icons**: Lucide React
- **Language**: TypeScript
- **Sanitization**: `sanitizeHtml()` (xss whitelist) in `lib/content-parser.ts`

## Environment Variables

Create a `.env` file with:

```env
# Supabase
NEXT_PUBLIC_PROJECT_URL=your_supabase_project_url
NEXT_PUBLIC_API_KEY=your_supabase_anon_key

# External Auth
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Main App (for sharing articles)
NEXT_PUBLIC_BASE_MAIN_APP=http://localhost:3000

# Workers
NEXT_PUBLIC_AI_WORKER_URL=http://localhost:8788
NEXT_PUBLIC_COMMS_WORKER_URL=http://localhost:8789
NEXT_PUBLIC_UPLOADS_WORKER_URL=http://localhost:8790
WORKER_API_KEY=

# Email
# All transactional email (campaigns, bulk sends) is sent from no-reply@techinika.com
# via the comms worker. `support@`/`editorial@` are user-facing contact addresses only.
RESEND_FROM="Techinika <no-reply@techinika.com>"
```

> **Note**: The service role key is used server-side only and is never exposed to client bundles. It is read from `SUPABASE_SERVICE_KEY` env var at runtime.

## Database Schema

### Articles Table
```sql
create table public.articles (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  lang text not null default 'english'::text,
  title text not null,
  slug text not null,
  author_id uuid null,
  category_id uuid null,
  date text null,
  read_time text null,
  image text null,
  content text not null,
  table_of_contents jsonb null,
  tags text null,
  summary text null,
  views numeric null default 0,
  status text null,
  ai_summary text null,
  feedback text null,
  featured_images text null,
  sources text null,
  author_name text null,
  drafted_at timestamp with time zone null,
  published_at timestamp with time zone null,
  constraint articles_pkey primary key (id),
  constraint articles_slug_lang_unique unique (slug, lang),
  constraint articles_author_id_fkey foreign key (author_id) references authors (id) on delete set null,
  constraint articles_category_id_fkey foreign key (category_id) references categories (id) on delete set null
);
```

### Categories Table
```sql
create table public.categories (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  lang text not null default 'en'::text,
  name text not null,
  description text null,
  constraint categories_pkey primary key (id),
  constraint categories_name_lang_unique unique (name, lang)
);
```

### Article Feedback Table
```sql
create table public.article_feedback (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  author_id uuid not null,
  article_id uuid not null,
  feedback_content text not null,
  resolved boolean not null default false,
  resolved_at timestamp with time zone null,
  constraint article_feedback_pkey primary key (id),
  constraint article_feedback_article_id_fkey foreign key (article_id) references articles (id) on delete CASCADE,
  constraint article_feedback_author_id_fkey foreign key (author_id) references authors (id) on delete CASCADE
);
```

### Article Contributors Table
```sql
create table public.article_contributors (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  article_id uuid not null,
  author_id uuid not null,
  contribution_type text not null default 'contributor'::text,
  constraint article_contributors_pkey primary key (id),
  constraint article_contributors_article_id_fkey foreign key (article_id) references articles (id) on delete CASCADE,
  constraint article_contributors_author_id_fkey foreign key (author_id) references authors (id) on delete CASCADE,
  constraint article_contributors_article_author_unique unique (article_id, author_id)
);
```

### Authors Table
```sql
create table public.authors (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  lang text not null default 'en'::text,
  name text not null,
  bio text null,
  image_url text null,
  external_link text null,
  username text null,
  role text not null default 'author'::text,
  constraint authors_pkey primary key (id)
);
```

### Top Banner Table
```sql
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
);
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## Build for Production

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Main dashboard with articles | Required |
| `/create` | Create new article | Required |
| `/edit/[id]` | Edit article with feedback & team management | Required |
| `/categories` | Manage categories | Required |
| `/ads` | Manage banner ads and top banners | Required |
| `/assets` | Manage uploaded assets | Required |
| `/subscribers` | Manage email subscribers | Required |
| `/bytes` | Quick bytes management | Required |
| `/comments` | Comment moderation | Required |
| `/campaigns` | Email campaign management | Required |
| `/stats` | Analytics dashboard | Required |

## User Roles & Permissions

| Feature | Author | Admin |
|---------|--------|-------|
| Create articles | Yes | Yes |
| Edit own articles | Yes | Yes |
| Edit any article | No | Yes |
| Delete articles | Own only | All |
| Add feedback | Yes | Yes |
| Resolve feedback | Own articles | All |
| Change article owner | No | Yes |
| Add/remove contributors | No | Yes |
| Manage categories | No | Yes |
| Manage ads | No | Yes |
| Manage assets | Own only | All |
| Send bulk email | No | Yes |
| Manage subscribers | Yes | Yes |
| Manage campaigns | Yes | Yes |

## Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| Modal | `components/Modal.tsx` | Accessible modal with focus trap, Escape, ARIA |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Error boundary wrapper |
| Toast | `components/Toast.tsx` | Toast notification provider |
| MainPage | `components/MainPage/` | Dashboard with article cards, filters, quick actions |
| CreateArticle | `components/CreateArticle/` | Article editor with toolbar, metadata, feedback, team panels |
| AdsPage | `components/AdsPage/` | Banner ads and top banner management |
| StatsPage | `components/pages/StatsPage.tsx` | KPI cards, articles breakdown |
| CalendarPicker | `components/Stats/CalendarPicker.tsx` | Month-view calendar date picker |
| PeriodStatsSection | `components/Stats/PeriodStatsSection.tsx` | Period stats with calendar and article filtering |
| TrendChart | `components/Stats/TrendChart.tsx` | Views trend chart (7/14/30/90 day) |
| StatsSubComponents | `components/Stats/StatsSubComponents.tsx` | Shared stat components (KPICard, EmptyState, StatusBadge) |

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/status` | GET | None | Check auth status |
| `/api/inline-upload` | POST | Required | Upload images via the uploads worker (R2) |
| `/api/inline-video-upload` | POST | Required | Upload videos via the uploads worker (R2) |
| `/api/upload-auth` | GET | Required | Retired — returns 410 (ImageKit client uploads removed) |
| `/api/imagekit/auth` | GET | Required | Legacy ImageKit signature endpoint (no longer referenced) |
| `/api/generate-feedback` | POST | Required | AI-generated article feedback |
| `/api/send-bulk-email` | POST | Admin | Queue bulk email to subscribers (async via comms worker); when `campaignId` is provided, resends using the existing campaign |
| `/api/contact` | POST | Public | Contact form (rate-limited) |
