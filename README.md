# Tuus Imago

Canvas photo printing e-commerce application. Customers upload photos, preview canvas prints with configurable proportions and optional AI effects, then order physical prints with payment via Przelewy24. Includes a partner/referral/coupon/promotion system and a full admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui |
| Routing | react-router-dom 7 |
| Backend | Supabase (Postgres, Auth, RLS), Netlify Functions |
| Images | Cloudinary (signed upload via Netlify Functions) |
| Payments | Przelewy24 (sandbox/production) |
| Admin | Refine + TanStack Table (`/admin`, gated by Supabase admin auth) |
| Testing | Vitest 4, Testing Library, jsdom |
| Linting | ESLint 9 (flat config), typescript-eslint |
| i18n | English + Polish |
| Package manager | pnpm |

## Local Development

### Prerequisites

- Node.js 22+
- pnpm

### Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` with your configuration values (see [Environment Variables](#environment-variables)).

### Running

```bash
pnpm dev              # Frontend only (Vite dev server)
pnpm dev:netlify      # Full stack with Netlify Functions
pnpm build            # TypeScript check + production build
pnpm preview          # Preview production build locally
```

Use `pnpm dev:netlify` when you need Netlify Functions (Cloudinary signed uploads, Przelewy24, etc.).

### Testing

```bash
pnpm test             # Run tests (Vitest)
```

Tests use jsdom environment with polyfills for `ResizeObserver`, `HTMLCanvasElement` (2D context mock), pointer capture APIs, and `window.matchMedia`. Setup is in `vitest.setup.ts`.

### Linting

```bash
pnpm lint             # ESLint
```

TypeScript checking runs as part of `pnpm build` (`tsc -b`).

## Environment Variables

All variables are documented in `.env.example`. Copy it to `.env` and fill in values.

### Frontend (Vite — `VITE_` prefix)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Yes | Cloudinary signed upload preset name |
| `VITE_CLOUDINARY_AI_TEMPLATE` | No | Cloudinary named transformation for AI preview (without `t_` prefix) |
| `VITE_SHOW_UPLOADER_DEBUG` | No | Enable debug mode (`true`/`false`) |
| `VITE_SHOW_DEBUG_PANEL` | No | Show the Cloudinary debug strip on the upload page (`true`/`false`) |
| `VITE_UPLOAD_DRAFT_MAX_AGE_HOURS` | No | Retention for an in-progress upload draft before it is discarded (default `168` = 7 days) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable (anon) key |
| `VITE_CONTENT_ALLOW_EMPTY` | No | **CI-only**: lets `vite build` bake empty content pages when Supabase credentials are unavailable. Never set in a deploy build. |

### Netlify Functions (server-side — no `VITE_` prefix)

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (never expose in frontend) |
| `SUPABASE_URL` | Yes | Supabase project URL (server-side) |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `SITE_URL` | Yes | Public site URL (used for P24 return URLs) |

### Przelewy24

| Variable | Required | Description |
|----------|----------|-------------|
| `P24_MERCHANT_ID` | Yes | Przelewy24 merchant ID |
| `P24_POS_ID` | Yes | Przelewy24 POS ID |
| `P24_CRC` | Yes | Przelewy24 CRC key |
| `P24_API_KEY` | Yes | Przelewy24 REST API key |
| `P24_API_BASE_URL` | Yes (non-local) | `https://secure.przelewy24.pl/api/v1` (production) or `https://sandbox.przelewy24.pl/api/v1` (sandbox). Must be set for non-local `SITE_URL`. |
| `P24_ALLOW_SANDBOX` | No | Set `true` only to intentionally keep the sandbox against a non-local site (deploy previews). Defaults to `false`. |
| `P24_STATUS_URL` | No | Override for Przelewy24 webhook target URL |

## Project Structure

```
src/
  pages/              # Route page components (storefront + auth)
  components/
    image-uploader/   # Upload & canvas preview system
    ui/               # shadcn/ui components (27 components)
    admin/            # Refine-based admin pages (orders, coupons, partners, etc.)
  lib/                # Business logic, API clients, utilities
  locales/            # i18n translations (en.json, pl.json)
  assets/             # Static assets (favicons, backgrounds)
  admin/              # Admin app wrapper, auth/data providers, layout
netlify/functions/    # Serverless functions (orders, payments, uploads, admin)
supabase/migrations/  # Database migration files
scripts/              # Dev scripts (Supabase migration helper)
docs/                 # Development notes
```

## Photo Upload Flow

The upload flow spans two synced routes rendered by the same page component
(so in-progress photo state is never lost when the URL changes):

- `/upload` — photo selection (camera / gallery / drag & drop). Any decodable
  image of an accepted type and size is accepted here.
- `/prepare-painting` — painting preview / editor on the wall background. The
  URL follows the selection state via replace-navigation: it switches to
  `/prepare-painting` once a photo is selected and back to `/upload` when all
  slots are cleared.

Printability (DPI) is evaluated in the preview, not at selection: per-size
availability drives the size selector, and a photo that cannot be printed in
any offered size gets an explanatory notice with retake / choose-from-gallery
actions plus a "low resolution — preview only" badge on the preview. Such
slots cannot be ordered (their checkbox in the checkout dropup is disabled);
checkout is possible once at least one printable slot is selected. The DPI
guard (thresholds, on/off) is remote-configurable in the admin panel.

## Database Migrations

Migrations are stored in `supabase/migrations/` and managed via Supabase CLI.

### Local development

```bash
export SUPABASE_PROJECT_REF=your_project_ref
export SUPABASE_DB_PASSWORD=your_database_password
pnpm db:migrate:dev
```

The script (`scripts/supabase-migrate.sh`) links the project and runs `supabase db push --linked`. It loads `.env.local` and `.env` automatically.

### Production

Migrations run automatically via CI when `supabase/migrations/**` files change on `main` (see [CI/CD](#cicd)).

## CI/CD

GitHub Actions workflow: `.github/workflows/run-checks.yml`

Three sequential jobs on every push:

1. **test** — `pnpm install --frozen-lockfile` → `pnpm test`
2. **lint** — `pnpm lint` → `npx tsc -b` → `pnpm build` (with `VITE_CONTENT_ALLOW_EMPTY=true`) → `pnpm audit --audit-level=high` (non-blocking)
3. **migrate** (main branch only, when `supabase/migrations/**` changed) — `pnpm db:migrate:deploy`

Required GitHub configuration:
- `SUPABASE_ACCESS_TOKEN` — **secret** (personal access token, `sbp_…`)
- `SUPABASE_DB_PASSWORD` — **secret** (Postgres database password)
- `SUPABASE_PROJECT_REF` — **repository variable** (non-sensitive project ID); a secret of the same name is also accepted as a fallback.

## Infrastructure

### Hosting

- **Netlify** — SPA with serverless functions
- SPA routing via `public/_redirects` (`/* → /index.html 200`)

### Database

- **Supabase** — Postgres with Row Level Security (RLS), Auth, and real-time
- Migrations covering orders, addresses, coupons, partners, referrals, promotions, content pages, and payment tracking

### Image Pipeline

- Direct browser-to-Cloudinary upload using **signed upload** flow
- Netlify Function (`cloudinary-signature`) generates server-side signatures
- `CLOUDINARY_API_SECRET` stays server-side only

### Payments

- Przelewy24 integration via two Netlify Functions:
  - `create-przelewy24-session` — registers transaction, returns payment URL
  - `przelewy24-webhook` — receives async notifications, verifies and marks orders as paid

## Legal Pages

Legal pages live in the Supabase `content_pages` table and are baked into the bundle at build time by the Vite content plugin (`virtual:tuus-content`). They are edited via the admin "Content" section, which triggers a rebuild through `NETLIFY_BUILD_HOOK_URL`.

- **Slugs** are unique per page; the storefront routes are derived from them.
- **Menu ordering** is controlled by the `menu_section` / `menu_order` columns.
- Only rows with `is_published = true` are publicly readable (RLS policy `content_pages_public_read`).
