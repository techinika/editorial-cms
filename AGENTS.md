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
- API routes requiring auth: `upload-auth`, `inline-upload`, `inline-video-upload`, `imagekit/auth`, `generate-feedback`.
- API routes requiring admin: `send-bulk-email`.
- Public routes (rate-limited): `contact`.

### Component Structure
- `components/[Feature]/index.tsx` — orchestrator (state, data fetching, realtime)
- `components/[Feature]/SubComponent.tsx` — extracted sub-components
- `components/[Feature]/useHook.ts` — custom hooks for logic
- `components/pages/[Name]Page.tsx` — page-level components (some are now re-exports)

### Modals
- All modals use `components/Modal.tsx` — provides focus trap, Escape key, ARIA roles, portal rendering.
- Never implement manual modal wrappers. Use `<Modal open={...} onClose={...} title="...">`.

### Content
- HTML content stored in `content` field as blocks JSON.
- `lib/content-parser.ts` contains `blocksToHtml()`, `parseHtmlToBlocks()`, `extractTOC()`, `sanitizeHtml()`.
- All HTML output is sanitized via DOMPurify.
- `generateBlockId()` uses `crypto.randomUUID()`.

### Security
- DOMPurify sanitization on all rendered HTML content.
- Security headers in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy.
- `poweredByHeader: false`.

### Proxy
- `proxy.ts` exports a function named `proxy` (not `middleware`) for Next.js 16 Turbopack.

## Key Files

| File | Purpose |
|------|---------|
| `supabase/supabase.ts` | Supabase client setup (anon + admin) |
| `lib/auth-server.ts` | Server-side auth helper |
| `lib/content-parser.ts` | HTML<->blocks conversion, sanitization |
| `components/Modal.tsx` | Accessible modal component |
| `components/ErrorBoundary.tsx` | Error boundary wrapper |
| `proxy.ts` | Next.js 16 proxy (replaces middleware) |
| `next.config.ts` | Security headers, config |

## Do NOT
- Fix "querries" spelling.
- Remove console.error statements (only console.log was removed).
- Use `window.location.href` for navigation — use `useRouter` from `next/navigation`.
- Import from `lib/cloudinary.ts` — it has been deleted.
- Use eager initialization for `supabaseAdminClient`.
