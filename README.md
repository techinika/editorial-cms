# Blog CMS

A content management system for blogs built with Next.js 16, Supabase, and Tailwind CSS.

## Features

### Authentication
- External auth integration via `NEXT_PUBLIC_AUTH_URL`
- Role-based access (only "author" role allowed)
- User info displayed in header with profile picture
- Admin users have additional privileges (change article ownership, manage contributors)

### Article Management
- View and manage articles on main dashboard
- Search articles by title, summary, or tags
- Pagination for article listings
- Filter by status (Draft, Published, Cancelled) and category

### Article Actions (on card hover)
- **Share** - Copy article URL to clipboard
- **Edit** - Navigate to `/edit/[articleId]`
- **Unpublish** - Move published article back to draft with optional feedback
- **Delete** - Delete article with confirmation modal

### Rich Text Editor (Create/Edit Article)
- **Modern Tiptap Editor** with full formatting support:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Blockquotes and code blocks
  - Links with custom URL input
  - **Image upload** to Cloudinary (`article-images` folder)
  - **Video upload** to Cloudinary (`article-videos` folder)
- **Real-time word count** and auto-calculated read time
- **Live preview mode** to see article before publishing
- **Save draft** to Supabase (creates or updates article)
- **Publish** with validation (requires title and content)
- **Category selection** from Supabase database
- **Featured image upload** to Cloudinary (`thumbnails` folder)
- **SEO description** field with character count hint
- **Tags input** for article categorization

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

### Categories Management (/categories)
- View all categories in table format
- Add new category with name and description
- Edit existing category
- Delete category with confirmation modal
- Search categories by name or description

### UI/UX
- Primary color: #3182ce (blue-500)
- Less rounded edges (rounded-md)
- Modern, clean design with gradient backgrounds
- Smooth transitions and hover effects
- Backdrop blur effects
- Responsive sidebar layout
- Custom form inputs with focus states

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Editor**: Tiptap v3 with extensions (Link, Image, Underline, Strike, Placeholder)
- **Storage**: Supabase (PostgreSQL) + Cloudinary (images/videos)
- **Authentication**: External auth app via REST API
- **Icons**: Lucide React
- **Language**: TypeScript

## Environment Variables

Create a `.env` file with:

```env
# Supabase
NEXT_PUBLIC_PROJECT_URL=your_supabase_project_url
NEXT_PUBLIC_API_KEY=your_supabase_anon_key
NEXT_PUBLIC_SERVICE_KEY=your_supabase_service_key

# Cloudinary (for image/video uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# External Auth
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Main App (for sharing articles)
NEXT_PUBLIC_BASE_MAIN_APP=http://localhost:3000
```

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

create index if not exists idx_article_feedback_article_id on public.article_feedback using btree (article_id);
create index if not exists idx_article_feedback_author_id on public.article_feedback using btree (author_id);
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

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with articles |
| `/create` | Create new article |
| `/edit/[id]` | Edit existing article with feedback & team management |
| `/categories` | Manage categories |

## User Roles & Permissions

| Feature | Author | Admin |
|---------|--------|-------|
| Create articles | ✓ | ✓ |
| Edit own articles | ✓ | ✓ |
| Edit any article | ✗ | ✓ |
| Delete articles | ✓ (own) | ✓ |
| Add feedback | ✓ | ✓ |
| Resolve feedback | ✓ (own articles) | ✓ |
| Change article owner | ✗ | ✓ |
| Add/remove contributors | ✗ | ✓ |
| Manage categories | ✗ | ✓ |

## Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| ArticleEditor | `components/pages/CreateArticle.tsx` | Main editor with toolbar, metadata sidebar, feedback panel |
| Dashboard | `components/pages/Home.tsx` | Main article listing with filters |
| CategoryManager | `components/pages/Categories.tsx` | Category CRUD operations |
| Stats | `components/pages/Stats.tsx` | Analytics dashboard |

## Server Actions

| Action | Location | Description |
|--------|----------|-------------|
| Feedback | `app/actions/feedback.ts` | Add/resolve feedback comments |
| Contributors | `app/actions/contributors.ts` | Manage article contributors, change owner |
