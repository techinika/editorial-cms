<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Conventions

## Spelling
- "querries" is intentional (even in database). Do NOT fix this spelling anywhere.

## Testing
- No tests needed for now.

## File Size
- Max 300 lines per component file. Refactor into sub-components or hooks when exceeding this limit.

## Architecture

### Supabase
- **Anon client** (`getSupabase()`): Used in client components for realtime subscriptions.
- **Admin client** (`getSupabaseAdmin()`): Used in server-side API routes and modules. Lazily initialized via Proxy.
- **Backward-compat alias**: `supabaseAdminClient` is a Proxy-based lazy getter for existing server modules.
- Never expose the service role key to client bundles.

### Authentication
- `checkAuthStatusServer()` from `lib/auth-server.ts` for server-side auth checks in API routes.
- `checkAuthStatus()` from `lib/auth.ts` for client-side auth.
- Every mutating server action in `app/actions/` calls `checkAuthStatusServer()` and `requireAuthor(auth)` — never trust the client-side user object.
- API routes requiring auth: `inline-upload`, `inline-video-upload`, `generate-feedback`, `imagekit/auth` (legacy, unreferenced).
- API routes requiring admin: `send-bulk-email`.
- `upload-auth` is a retired 410 stub (ImageKit client uploads removed).
- Public routes (rate-limited): `contact`.

### Component Structure
- `components/[Feature]/index.tsx` — orchestrator (state, data fetching, realtime)
- `components/[Feature]/SubComponent.tsx` — extracted sub-components
- `components/[Feature]/useHook.ts` — custom hooks for logic
- `components/pages/[Name]Page.tsx` — page-level components (some are now re-exports)
- `components/Stats/` — stats sub-components (CalendarPicker, PeriodStatsSection, TrendChart, StatsSubComponents)

### Modals
- All modals use `components/Modal.tsx` — provides focus trap, Escape key, ARIA roles, portal rendering.
- Never implement manual modal wrappers. Use `<Modal open={...} onClose={...} title="...">`.

### Content
- HTML content stored in `content` field as blocks JSON.
- `lib/content-parser.ts` contains `blocksToHtml()`, `parseHtmlToBlocks()`, `extractTOC()`, `sanitizeHtml()`.
- All HTML output is sanitized via `sanitizeHtml()` (xss-package whitelist), including Quick Bytes on create/update.
- `generateBlockId()` uses `crypto.randomUUID()`.

### Security
- `sanitizeHtml()` (xss whitelist) on all rendered HTML content.
- Security headers in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy.
- `poweredByHeader: false`.

### Email
- All transactional email (campaigns, bulk sends) goes through the comms worker and is sent
  from `no-reply@techinika.com`. Never send transactional email from a user-facing address.
- `support@techinika.com` / `editorial@techinika.com` are contact addresses only.

### Proxy
- `proxy.ts` exports a function named `proxy` (not `middleware`) for Next.js 16 Turbopack.

### Companies & Events
- Company images live in `assets` via `featured_startups.image_ref`. Always join
  `image:assets!image_ref(id, url)` and render `company.image?.url`. Never use `logo_url`.
- `events.external_link`: `"register"` = platform RSVP page on the blog, a URL = external
  registration link, `null` = no registration.
- Event slugs are `generateSlug(title) + "-" + Date.now().toString(36)` — the events table has a
  global unique slug constraint shared with org-cms.
- `events.full_description` is rich text (HTML) edited via `components/events/RichTextEditor.tsx`
  and sanitized with `sanitizeHtml()` before insert.

## Key Files

| File | Purpose |
|------|---------|
| `supabase/supabase.ts` | Supabase client setup (anon + admin) |
| `supabase/modules/stats.ts` | Stats queries (getAllStats, getUserStats, getArticleCountByPeriod, getArticlesByDateRange, getViewsByDay) |
| `supabase/modules/subscribers.ts` | Subscriber queries (getAllSubscribers for CSV export, createSubscribers for bulk import) |
| `supabase/modules/campaignRecipients.ts` | Campaign recipient tracking for async email queue |
| `supabase/modules/quickBytes.ts` | Quick byte queries (search, count, auto-slug) |
| `supabase/modules/companies.ts` | Company search/list (`CompanyOption`, images via `image_ref` asset join) |
| `supabase/modules/events.ts` | Event creation (`createEvent`) |
| `supabase/modules/articleCompanies.ts` | Article↔company match CRUD for `article_companies` |
| `app/api/match-companies/route.ts` | AI article↔company matching proxy (chunks companies through ai-worker) |
| `app/api/match-all/route.ts` | AI batch matching proxy (latest published articles × all companies, grouped by company) |
| `components/article-matches/BatchMatches.tsx` | Self-contained batch matching UI with per-company groups |
| `components/pages/EventFormPage.tsx` | Event creation form (organizer search, registration choice) |
| `components/events/RichTextEditor.tsx` | Reusable Tiptap HTML editor with formatting toolbar |
| `components/events/useEventForm.ts` | Event form state + save logic hook |
| `components/pages/ArticleMatchesPage.tsx` | Article ↔ company matching page (manual + AI suggestions) |
| `components/companies/CompanySearchInput.tsx` | Debounced company search input (shared) |
| `lib/auth-server.ts` | Server-side auth helper |
| `lib/content-parser.ts` | HTML<->blocks conversion, sanitization |
| `components/Modal.tsx` | Accessible modal component |
| `components/ErrorBoundary.tsx` | Error boundary wrapper |
| `components/Stats/CalendarPicker.tsx` | Month-view calendar date picker |
| `components/Stats/PeriodStatsSection.tsx` | Period stats with calendar integration |
| `components/Stats/TrendChart.tsx` | Views trend chart (7/14/30/90 day) |
| `components/Stats/StatsSubComponents.tsx` | Shared stat components (KPICard, EmptyState, StatusBadge) |
| `proxy.ts` | Next.js 16 proxy (replaces middleware) |
| `next.config.ts` | Security headers, config |

## Do NOT
- Fix "querries" spelling.
- Remove console.error statements (only console.log was removed).
- Use `window.location.href` for navigation — use `useRouter` from `next/navigation`.
- Import from `lib/cloudinary.ts` — it has been deleted.
- Use eager initialization for `supabaseAdminClient`.
