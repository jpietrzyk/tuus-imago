# Plan: Migrate to Supabase Publishable Key & JWT Signing Keys

## Goal

Replace the legacy `anon` JWT-based API key with Supabase's new **Publishable key** (`sb_publishable_...`) and migrate from the legacy JWT secret to the new **JWT Signing Keys** system (asymmetric ES256). This is a prerequisite before enabling user auth in production — starting with the correct key architecture avoids a painful migration later.

---

## Background: Why Migrate?

The legacy `anon` key is a long-lived JWT (HS256, 10-year expiry) signed by the project's JWT secret. It is tightly coupled with the `service_role` key and user session JWTs — rotating one forces rotation of all, causing downtime and signing out every user. Supabase introduced a new key system to fix this:

| Aspect | Legacy `anon` key | New Publishable key |
|---|---|---|
| Format | Long JWT (`eyJ...`) | Short opaque string (`sb_publishable_...`) |
| Rotation | Tied to JWT secret; all keys rotate together, causes downtime | Independently rotatable, zero downtime |
| Revocation | Cannot revoke without JWT secret rotation (signs out all users) | Deactivatable independently in dashboard |
| Coupling | Shares JWT secret with `service_role` and user tokens | Decoupled from JWT signing keys entirely |
| Security | Symmetric HS256, 10-year expiry | Managed by Supabase API Gateway, shorter lifecycle |

Similarly, the legacy JWT signing system uses a single shared secret for all token signing. The new **JWT Signing Keys** system uses asymmetric keys (ES256 P-256) enabling:
- Zero-downtime key rotation
- No users signed out during rotation
- Independent management of API keys vs signing keys
- Better security compliance (SOC2, PCI-DSS alignment)

---

## Phase 1: Generate New API Keys (Supabase Dashboard)

### Step 1.1: Create Publishable Key

In Supabase Dashboard → **Settings** → **API Keys** → **API Keys** tab:

1. If no publishable key exists, click **Create new API Keys**
2. Copy the **Publishable key** value (`sb_publishable_...`)
3. This replaces `VITE_SUPABASE_ANON_KEY`

### Step 1.2: Create a New Secret Key (for server-side)

In the same **API Keys** tab:

1. A new secret key (`sb_secret_...`) should have been created alongside the publishable key
2. This replaces the legacy `service_role` JWT for server-side operations
3. Copy the **Secret key** value

### Step 1.3: Verify Both Key Sets Coexist

Both legacy and new keys work simultaneously during migration. Verify in the dashboard that:
- Legacy tab: `anon` and `service_role` JWTs are still listed
- API Keys tab: Publishable and secret keys are listed
- **Do NOT deactivate legacy keys yet** — do that after all code is migrated

---

## Phase 2: Migrate JWT Signing Keys (Supabase Dashboard)

This step is done in the dashboard and does NOT cause downtime. Auth code continues working throughout.

### Step 2.1: Initiate Migration

Go to **Settings** → **JWT Signing Keys**:

1. Click **Migrate JWT secret** — this imports the existing legacy JWT secret into the new signing keys system
2. A new asymmetric ES256 key is automatically created as a **standby** key

### Step 2.2: Rotate to Asymmetric Key

1. Click **Rotate keys** to promote the standby ES256 key to "current"
2. Supabase Auth immediately starts signing new user JWTs with ES256
3. Existing non-expired JWTs signed with the legacy secret continue to be accepted
4. **No users are signed out**

### Step 2.3: Wait, Then Revoke Legacy Key

1. Wait at least **1 hour 15 minutes** (longer than the access token expiry) after rotation
2. Then revoke the legacy JWT secret key in the dashboard
3. **Important**: Before revoking, you MUST deactivate the legacy `anon` and `service_role` JWT keys (see Phase 4)

### Step 2.4: Verify JWKS Endpoint

After rotation, verify the public key is discoverable:

```
GET https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

Should return a JSON Web Key Set with the ES256 public key. The Supabase client library (`@supabase/supabase-js ^2.100.0`) handles this automatically.

---

## Phase 3: Update Environment Variables

### Step 3.1: Update `.env.example`

Replace legacy key references:

```diff
- # Supabase public (anon) key — safe for the browser, works with RLS policies
+ # Supabase publishable key — safe for the browser, works with RLS policies
  VITE_SUPABASE_URL=your_supabase_project_url
- VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
+ VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

  # Netlify Function server-side variables (do NOT use VITE_ prefix)
  CLOUDINARY_API_KEY=your_cloudinary_api_key
  CLOUDINARY_API_SECRET=your_cloudinary_api_secret
  SUPABASE_URL=your_supabase_project_url
- SUPABASE_SECRET_KEY=your_supabase_secret_key
+ SUPABASE_SECRET_KEY=your_supabase_new_secret_key
  SITE_URL=https://your-site.example
```

### Step 3.2: Update `.env` (local development)


### Step 3.3: Update Netlify Environment Variables

In Netlify Dashboard → **Site settings** → **Environment variables**:

1. Add `VITE_SUPABASE_PUBLISHABLE_KEY` with the publishable key value
2. Update `SUPABASE_SECRET_KEY` to the new `sb_secret_...` value (if different)
3. Remove `VITE_SUPABASE_ANON_KEY` (or leave empty — code will stop reading it)
4. Remove `SUPABASE_ANON_KEY` if it exists

---

## Phase 4: Update Code

### Step 4.1: Frontend Supabase client

**File: `src/lib/supabase-client.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
```

Changes:
- `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY`
- Variable name: `supabaseAnonKey` → `supabasePublishableKey`
- Error message updated to reference new env var name

### Step 4.2: Server-side auth verification

**File: `netlify/functions/_shared/supabase-auth.ts`**

In `getAuthenticatedUser()`:
```typescript
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  return {
    error: {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Supabase configuration." }),
    },
  };
}

const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
```

Changes:
- Remove `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` fallback chain
- Use `SUPABASE_PUBLISHABLE_KEY` (Netlify function env var, no `VITE_` prefix)
- Fallback to `VITE_SUPABASE_PUBLISHABLE_KEY` for local dev convenience

In `createServiceClient()`:
- Already uses `SUPABASE_SECRET_KEY` — no change needed (the env var name stays the same, only the value changes to `sb_secret_...`)

### Step 4.3: No changes needed in these files

The following files use `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (server-side only) and are unaffected:

- `netlify/functions/create-order.ts` — uses service client
- `netlify/functions/create-przelewy24-session.ts` — uses service client
- `netlify/functions/przelewy24-webhook.ts` — uses service client
- `netlify/functions/sync-hubspot-contact.ts` — uses service client
- `netlify/functions/debug-orders.ts` — uses service client
- `netlify/functions/admin-update-shipment.ts` — uses service client
- `netlify/functions/admin-shipment-options.ts` — uses service client

All tests in `netlify/__tests__/` only set `SUPABASE_URL` and mock `createClient` — no env var changes needed.

### Step 4.4: Update test files (if any reference `ANON_KEY`)

Search for any test setup referencing `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`:

- `netlify/__tests__/test-utils/supabase-mocks.ts` — no env var references, no changes
- Individual test files — only reference `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, no changes

---

## Phase 5: Deactivate Legacy Keys (Post-Migration)

**Only after all code is deployed and verified working with new keys.**

### Step 5.1: Verify No Legacy Key Usage

In the Supabase Dashboard → **Settings** → **API Keys**:
- Check the **Last used** indicators on the legacy `anon` and `service_role` keys
- Confirm they show no recent usage (or only very old timestamps)

### Step 5.2: Deactivate Legacy Keys

1. In **API Keys** tab, deactivate the legacy `anon` key
2. Deactivate the legacy `service_role` key
3. These can be re-activated if needed

### Step 5.3: Revoke Legacy JWT Signing Key

If Phase 2 was completed:
1. Go to **Settings** → **JWT Signing Keys**
2. The legacy JWT secret should be in "Previously used" state
3. Revoke it — this is safe now that no code uses the legacy JWT-based keys

---

## Files to Modify Summary

| Action | File | Description |
|---|---|---|
| MODIFY | `src/lib/supabase-client.ts` | `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` |
| MODIFY | `netlify/functions/_shared/supabase-auth.ts` | Update env var references in `getAuthenticatedUser()` |
| MODIFY | `.env.example` | Update env var names and descriptions |
| MODIFY | `.env` | Update values with new key format |
| CONFIG | Netlify Dashboard | Update environment variables |
| CONFIG | Supabase Dashboard | Create publishable + secret keys, migrate JWT signing keys |

---

## Key Considerations

### Backward Compatibility
- Both old and new keys work simultaneously during migration
- Deploy code changes first, verify, then deactivate legacy keys
- No downtime at any step

### Edge Functions Limitation
- Publishable/secret keys are NOT JWTs — they cannot be sent as `Authorization: Bearer` header
- If Edge Functions are added later, use `--no-verify-jwt` and implement `apikey` header verification inside the function
- This does NOT affect Netlify Functions (they verify JWTs via `supabase.auth.getUser(token)`)

### Self-Hosting / CLI
- Publishable and secret keys are hosted platform only
- The CLI / local dev uses the Supabase hosted platform URL anyway (via `SUPABASE_URL`), so this works fine
- Local development with `supabase start` still uses `anon`/`service_role` JWTs — but our local dev connects to the hosted instance

### `supabase.auth.getUser()` in Netlify Functions
- The `getAuthenticatedUser()` helper verifies user JWTs using the Supabase client
- With the new signing keys system, `getUser()` automatically uses the JWKS endpoint for verification
- No code changes needed — `@supabase/supabase-js ^2.100.0` handles this transparently

### Security Improvements
- Publishable key is shorter and opaque — less information leakage in bundles
- Secret keys (`sb_secret_...`) cannot be used in browsers (server-side User-Agent check)
- Asymmetric signing means the private key cannot be extracted from Supabase
- Independent rotation means a compromised key can be rotated without affecting users
