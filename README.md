# Blog CMS

A content management system for blogs built with Next.js 16, Supabase, and Tailwind CSS.

## Features

### Article Management
- View and manage articles
- Search articles by title, summary, or tags
- Pagination for article listings
- Responsive dashboard design

### Rich Text Editor (CreateArticle)
- **Modern Tiptap Editor** with full formatting support:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Blockquotes and code blocks
  - Links with custom URL input
  - **Image upload** to Cloudinary (with file picker)
  - **Video upload** to Cloudinary (with file picker)
- **Real-time word count** and auto-calculated read time
- **Live preview mode** to see article before publishing
- **Save draft** to Supabase (creates or updates article)
- **Publish** with validation (requires title and content)
- **Category selection** from Supabase database
- **Featured image upload** to Cloudinary
- **SEO description** field with character count hint
- **Tags input** for article categorization

### UI/UX
- Primary color: #3182ce (blue-500)
- Less rounded edges (rounded-md instead of rounded-xl)
- Modern, clean design with gradient backgrounds
- Smooth transitions and hover effects
- Backdrop blur effects
- Responsive sidebar layout
- Custom form inputs with focus states

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Editor**: Tiptap v3 with extensions (Link, Image, Underline, Strike, Placeholder)
- **Storage**: Supabase (PostgreSQL) + Cloudinary (images/videos)
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
# Supabase
NEXT_PUBLIC_PROJECT_URL=your_supabase_project_url
NEXT_PUBLIC_API_KEY=your_supabase_anon_key
NEXT_PUBLIC_SERVICE_KEY=your_supabase_service_key

# Cloudinary (for image/video uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

3. Ensure your Supabase database has the `articles` table:
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
  drafted_at timestamp with time zone null,
  constraint articles_pkey primary key (id),
  constraint articles_slug_lang_unique unique (slug, lang)
);
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Article Schema

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Creation timestamp |
| title | text | Article title |
| slug | text | URL-friendly slug |
| content | text | HTML content from editor |
| image | text | Featured image URL (Cloudinary) |
| category_id | uuid | Foreign key to categories |
| tags | text | Comma-separated tags |
| summary | text | SEO description |
| read_time | text | Estimated read time |
| status | text | 'draft' or 'published' |
| drafted_at | timestamp | When draft was last saved |