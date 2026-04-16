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
| CRM | HubSpot (non-blocking contact sync) |
| CMS | Decap CMS (legal pages at `/admin/`) |
| Admin | Refine framework with TanStack Table |
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
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable (anon) key |

### Netlify Functions (server-side — no `VITE_` prefix)

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (never expose in frontend) |
| `SUPABASE_URL` | Yes | Supabase project URL (server-side) |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `SITE_URL` | Yes | Public site URL (used for P24 return URLs) |
| `ADMIN_SHIPMENT_TOKEN` | Yes | Token for admin shipment endpoints |

### Przelewy24

| Variable | Required | Description |
|----------|----------|-------------|
| `P24_MERCHANT_ID` | Yes | Przelewy24 merchant ID |
| `P24_POS_ID` | Yes | Przelewy24 POS ID |
| `P24_CRC` | Yes | Przelewy24 CRC key |
| `P24_API_KEY` | Yes | Przelewy24 REST API key |
| `P24_API_BASE_URL` | Yes | `https://sandbox.przelewy24.pl/api/v1` (sandbox) or `https://secure.przelewy24.pl/api/v1` (production) |
| `P24_STATUS_URL` | No | Override for Przelewy24 webhook target URL |

### HubSpot CRM

| Variable | Required | Description |
|----------|----------|-------------|
| `HS_PRIVATE_APP_ACCESS_TOKEN` | No | HubSpot project-based app static token |
| `HUBSPOT_API_BASE_URL` | No | Defaults to `https://api.hubapi.com`. Use `https://api.hubapi.eu` for EU data residency |

### Debug

| Variable | Required | Description |
|----------|----------|-------------|
| `DEBUG_ORDERS_ENABLED` | No | Enable debug orders endpoint (`true`/`false`) |
| `DEBUG_ORDERS_TOKEN` | No | Token for debug orders endpoint |

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
netlify/functions/    # Serverless functions (orders, payments, uploads, CRM)
supabase/migrations/  # Database migration files
content/legal/        # Markdown content for legal pages (managed via CMS)
scripts/              # Dev scripts (Supabase migration helper)
docs/                 # Development notes
```

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
2. **lint** — `pnpm lint`
3. **migrate** (main branch only, when `supabase/migrations/**` changed) — `pnpm db:migrate:deploy`

Required GitHub repository secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

## Infrastructure

### Hosting

- **Netlify** — SPA with serverless functions
- SPA routing via `public/_redirects` (`/* → /index.html 200`)

### Database

- **Supabase** — Postgres with Row Level Security (RLS), Auth, and real-time
- 17 migrations covering orders, addresses, coupons, partners, referrals, promotions, and payment tracking

### Image Pipeline

- Direct browser-to-Cloudinary upload using **signed upload** flow
- Netlify Function (`cloudinary-signature`) generates server-side signatures
- `CLOUDINARY_API_SECRET` stays server-side only

### Payments

- Przelewy24 integration via two Netlify Functions:
  - `create-przelewy24-session` — registers transaction, returns payment URL
  - `przelewy24-webhook` — receives async notifications, verifies and marks orders as paid

### CRM

- HubSpot contact sync via `sync-hubspot-contact` Netlify Function
- Non-blocking — sync failure does not prevent checkout or payment
- Requires custom contact properties in HubSpot (see `.env.example` comments)

## Legal Pages & CMS

Legal pages are Markdown files in `content/legal/`, managed via **Decap CMS** at `/admin/`.

- **Slugs are derived from filenames** (e.g., `terms.md` → `/terms`). Renaming a file requires updating all references.
- **Menu ordering** is controlled by the `menuOrder` frontmatter field within each menu section (`legal`, `payments`, `company`).
- Pages containing `[PLACEHOLDER: ...]` markers need business-specific values filled in.
