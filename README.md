# tuus-imago

Tuus Imago front page

## Legal Pages (Przelewy24.pl Requirements)

This section documents the legal pages required for Przelewy24.pl payment integration compliance.

### Completed Pages

| Page | File | Status | Description |
|------|------|--------|-------------|
| Payment Terms | `src/pages/payments.tsx` | ✅ Complete | BLIK, bank transfer, cards, installments, Przelewy24 info |
| Shipping | `src/pages/shipping.tsx` | ✅ Complete | InPost, 14.99 PLN, 2-4 business days, no international |
| Returns & Complaints | `src/pages/returns.tsx` | ✅ Complete | 14-day withdrawal, return process, contact info |
| Complaint Form | `src/pages/complaint.tsx` | ✅ Complete | Full form with customer info, order details, photo upload |
| Privacy Policy | `src/pages/privacy.tsx` | ✅ Complete | GDPR compliant, data processing, rights |
| Terms and Conditions | `src/pages/terms.tsx` | ✅ Complete | Full terms with scope, ordering, pricing, liability, consumer rights |

### Pages Still Needed

| Page | File | Status | Required Info |
|------|------|--------|---------------|
| Cookie Policy | `src/pages/cookies.tsx` | ⚠️ Placeholder | Cookie list, third-party providers |
| Company Information | `src/pages/contact.tsx` | ⚠️ Partial | NIP, REGON, KRS, bank details, VAT ID |
| Checkout Checkboxes | `src/pages/checkout.tsx` | ⚠️ Missing | Terms/privacy/marketing checkboxes |

### Placeholders

Some pages contain `[PLACEHOLDER: ...]` markers for business-specific values that need to be filled:
- Company name, address, NIP, REGON
- Contact email and phone number
- Complaint email
- Bank account details

### Managing Legal Pages via CMS

Legal pages are stored as Markdown files in [content/legal/](content/legal/) and edited via Decap CMS (Netlify CMS).

**Important: slug is derived from filename, not editable**

The `slug` field determines the page URL (e.g., `terms.md` → `/terms`). It is **automatically calculated from the filename** and cannot be edited in CMS. This ensures routing remains valid and prevents accidentally breaking page links.

**If you need to move or rename a page:**
1. Rename the file in the repository (e.g., `terms.md` → `policies.md`)
2. Update any code that references the old slug (routing, links, tests)
3. Commit both changes together

The CMS will always respect the filename-based slug, ignoring any stale `slug` value in the frontmatter.

## Cloudinary setup (required for upload)

This app uploads directly from browser to Cloudinary using a **signed upload** flow via Netlify Functions.

### 1) Create upload preset in Cloudinary

1. Open Cloudinary Dashboard.
2. Go to **Settings → Upload → Upload presets**.
3. Click **Add upload preset**.
4. Set:
   - **Signing Mode**: `Signed`
   - **Folder**: `tuus-imago` (optional, but matches app defaults)
   - **Allowed formats**: `jpg,jpeg,png,webp`
   - **Max file size**: `10MB` (optional, UI already checks)
5. Save and copy preset name.

### 2) Configure `.env`

Set these values:

- `VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>`
- `VITE_CLOUDINARY_UPLOAD_PRESET=<your_signed_preset_name>`

Optional (AI preview template):

- `VITE_CLOUDINARY_AI_TEMPLATE=<your_named_transformation>`

`VITE_CLOUDINARY_AI_TEMPLATE` should be the **name of a Cloudinary named transformation** (without the `t_` prefix).
When set, the app adds this template to the post-upload preview URL before selected AI effects.

Example:

- `VITE_CLOUDINARY_AI_TEMPLATE=portrait_ai`

In Cloudinary, create this under **Settings → Transformations** (or named transformations UI), then reference that exact name in `.env`.

### 3) Configure Netlify function env vars

Set server-side environment variables in Netlify:

- `CLOUDINARY_API_KEY=<your_api_key>`
- `CLOUDINARY_API_SECRET=<your_api_secret>`

Local development note:

- Run with `netlify dev` so `/.netlify/functions/cloudinary-signature` is available.
- Keep these as non-`VITE_` variables because they are read by the Netlify Function runtime (`process.env`).

### 4) Important security note

Do **not** expose `CLOUDINARY_API_SECRET` in frontend `VITE_*` variables.
For signed uploads or admin operations, use a backend endpoint that signs requests server-side.

### 5) Troubleshooting

- If you see `Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in server environment`, verify you did not use `VITE_` (or `VITTE_`) prefix for function secrets.
- Frontend reads only: `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`.
- Netlify Function reads only: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## Supabase migrations

### Run migrations from local dev

Use:

- `pnpm db:migrate:dev`

This links the configured project and runs `supabase db push --linked`.
The script automatically loads `.env.local` and `.env` (if present), so you can store local migration variables there.

Required shell env vars for local run:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

`SUPABASE_DB_PASSWORD` must be your Postgres database password (not `SUPABASE_SECRET_KEY` / `sb_secret_*`).

Example:

```bash
export SUPABASE_PROJECT_REF=bwwtoitwhkalbmlgxfgf
export SUPABASE_DB_PASSWORD=your_database_password
pnpm db:migrate:dev
```

### Deployment migration action

Repository runs migrations as part of [.github/workflows/run-checks.yml](.github/workflows/run-checks.yml):

- Job order: tests -> lint -> migrate
- Migrate job runs only on `main`
- Migrate job runs only when `supabase/migrations/**` changed in the push

Required GitHub repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

The migration step executes `pnpm db:migrate:deploy`, which links the Supabase project and runs `supabase db push --linked`.

## Admin shipment update endpoint

The repository includes an admin-only Netlify function for shipment operations:

- Path: `/.netlify/functions/admin-update-shipment`
- Method: `POST`
- Auth header: `x-admin-token: <ADMIN_SHIPMENT_TOKEN>`

Shipment status helper endpoint:

- Path: `/.netlify/functions/admin-shipment-options?orderId=<ORDER_UUID>`
- Method: `GET`
- Auth header: `x-admin-token: <ADMIN_SHIPMENT_TOKEN>`
- Returns current shipment status and allowed next statuses for that order

Required server env:

- `ADMIN_SHIPMENT_TOKEN`

Request body:

- `orderId`: order UUID
- `shipmentStatus`: one of `pending_fulfillment`, `in_transit`, `delivered`, `failed_delivery`, `returned`
- `trackingNumber`: optional tracking value
- `note`: optional history note

Behavior:

- Validates shipment status transitions
- Updates `orders.shipment_status` and `orders.tracking_number`
- Appends `order_status_history` shipment event entry

## Przelewy24 payment backend slice

The repository now includes the first backend-only Przelewy24 integration slice:

- `/.netlify/functions/create-przelewy24-session`
- `/.netlify/functions/przelewy24-webhook`

Current behavior:

- Loads an existing order from Supabase
- Registers a Przelewy24 transaction via `transaction/register`
- Stores payment session fields on `orders`
- Verifies asynchronous notifications via `transaction/verify`
- Marks orders as paid after successful verification
- Appends `payment` and `order` entries into `order_status_history`

Required server env:

- `SITE_URL`
- `P24_MERCHANT_ID`
- `P24_POS_ID`
- `P24_CRC`
- `P24_API_KEY`
- `P24_API_BASE_URL`

Optional server env:

- `P24_STATUS_URL`

Suggested values:

- Sandbox API: `https://sandbox.przelewy24.pl/api/v1`
- Production API: `https://secure.przelewy24.pl/api/v1`

Session creation endpoint:

- Path: `/.netlify/functions/create-przelewy24-session`
- Method: `POST`
- Body: `{ "orderId": "<ORDER_UUID>", "language": "pl" | "en" }`
- Response: `orderId`, `orderNumber`, `paymentSessionId`, `redirectUrl`

Webhook endpoint:

- Path: `/.netlify/functions/przelewy24-webhook`
- Method: `POST`
- Called by Przelewy24 with transaction notification JSON
- Verifies Przelewy24 signature first, then confirms the payment via `transaction/verify`

Database changes:

- New migration: `supabase/migrations/202603250001_add_przelewy24_payment_fields.sql`
- Adds payment tracking fields to `orders`
- Extends `order_status_history.status_type` with `payment`

Test coverage:

- `netlify/functions/create-przelewy24-session.test.ts`
- `netlify/functions/przelewy24-webhook.test.ts`
- Shared Supabase test helper: `netlify/functions/test-utils/supabase-mocks.ts`

## HubSpot CRM integration

The checkout flow pushes customer data to HubSpot CRM as a Contact between order creation and Przelewy24 session creation. HubSpot sync is **non-blocking** — failure does not prevent checkout or payment.

### Endpoints

- `/.netlify/functions/sync-hubspot-contact`
- Method: `POST`
- Body: `{ "orderId": "<ORDER_UUID>" }`
- Response: `{ "synced": true, "contactId": "<HUBSPOT_CONTACT_ID>" }`

### HubSpot setup

1. Create a **Project-based App** via HubSpot CLI: `hs project create` (or use an existing project)
2. Grant scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`
3. Deploy the project and generate a **static access token** from the project app settings
4. Set `HS_PRIVATE_APP_ACCESS_TOKEN` in your environment
5. Create a property group named `tuus_imago` in HubSpot (Contacts → Settings → Properties → Groups)
6. Create these custom contact properties in the `tuus_imago` group:
   - **tuus_imago_order_number** — Single-line text
   - **tuus_imago_order_value** — Number
   - **tuus_imago_items_count** — Number
   - **tuus_imago_checkout_date** — Date picker
   - **tuus_imago_marketing_consent** — Single-line text
   - **tuus_imago_order_status** — Single-line text

Custom properties must be created manually in HubSpot before first sync. They are **not** auto-created by the application.

### Required server env

- `HS_PRIVATE_APP_ACCESS_TOKEN` — Project-based app static access token
- `HUBSPOT_API_BASE_URL` — Optional, defaults to `https://api.hubapi.com`. Use `https://api.hubapi.eu` for EU data residency.

### Database changes

- Migration: `supabase/migrations/202604040001_add_hubspot_crm_fields.sql`
- Adds `hubspot_contact_id` and `hubspot_synced_at` columns to `orders`
- Extends `order_status_history.status_type` with `crm`

### Test coverage

- `netlify/__tests__/sync-hubspot-contact.test.ts`
- `netlify/__tests__/_shared/hubspot.test.ts`
