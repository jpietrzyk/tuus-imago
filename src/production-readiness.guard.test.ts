import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FUNCTIONS_DIR = resolve(ROOT, "netlify/functions");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function functionFiles(dir = FUNCTIONS_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return functionFiles(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

describe("production readiness guards", () => {
  it("guards profiles.is_admin against self-elevation", () => {
    const migration = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(resolve(MIGRATIONS_DIR, file), "utf8"))
      .join("\n");

    expect(migration).toContain("prevent_profile_admin_self_update");
    expect(migration).toMatch(
      /create trigger profiles_prevent_admin_self_update[\s\S]*before update on public\.profiles/,
    );
    expect(migration).toMatch(
      /create policy "Users can update own profile"[\s\S]*with check \(auth\.uid\(\) = id\)/,
    );
  });

  it("does not leak debug fields or raw error details from Netlify functions", () => {
    for (const file of functionFiles()) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} must not return debug fields`).not.toMatch(
        /\bdebug[_A-Za-z]*\s*:/,
      );
      expect(source, `${file} must not return raw error detail fields`).not.toMatch(
        /\b(?:detail\w*|errorDetails?)\s*:/i,
      );
    }
  });

  it("sets baseline security headers and a CSP", () => {
    const headers = read("public/_headers");

    for (const header of [
      "X-Content-Type-Options: nosniff",
      "X-Frame-Options: DENY",
      "Referrer-Policy:",
      "Permissions-Policy:",
      "Strict-Transport-Security:",
      "Content-Security-Policy:",
      "frame-ancestors 'none'",
    ]) {
      expect(headers, `missing header: ${header}`).toContain(header);
    }
  });

  it("pins search_path on every SQL function", () => {
    const migrations = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(resolve(MIGRATIONS_DIR, file), "utf8"))
      .join("\n");

    const names = [
      ...migrations.matchAll(
        /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)\s*\(/gi,
      ),
    ].map((match) => match[1]);

    expect(names.length).toBeGreaterThan(0);

    for (const name of new Set(names)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const inline = new RegExp(
        `create\\s+(?:or\\s+replace\\s+)?function\\s+public\\.${escaped}\\s*\\([\\s\\S]{0,800}?set\\s+search_path\\s*=`,
        "i",
      );
      const alter = new RegExp(
        `alter\\s+function\\s+public\\.${escaped}\\s*\\(\\s*\\)\\s+set\\s+search_path`,
        "i",
      );

      expect(
        inline.test(migrations) || alter.test(migrations),
        `SQL function ${name} does not pin search_path`,
      ).toBe(true);
    }
  });

  it("exposes an unauthenticated /health uptime endpoint", () => {
    const redirects = read("public/_redirects");

    expect(redirects).toMatch(
      /^\/health\s+\/\.netlify\/functions\/health\s+200$/m,
    );

    const source = read("netlify/functions/health.ts");

    expect(source).toContain('withSentry("health"');
    // The probe is consumed by monitors that cannot authenticate, so it must
    // never require a bearer token and must keep its response uncached.
    expect(source).not.toContain("getAuthenticatedUser");
    expect(source).toContain("no-store");
  });

  it("rate limits the unauthenticated write endpoints", () => {
    // Netlify allows only two code-based rules on the lowest plans, so only the
    // two resource-creating endpoints are protected here.
    const endpoints = ["create-order", "cloudinary-signature"];

    for (const endpoint of endpoints) {
      const source = readFileSync(
        resolve(FUNCTIONS_DIR, `${endpoint}.ts`),
        "utf8",
      );
      expect(source, `${endpoint} declares a rateLimit config`).toContain(
        "rateLimit:",
      );
      expect(source, `${endpoint} preserves its function path`).toContain(
        `path: "/.netlify/functions/${endpoint}"`,
      );
      // Netlify ignores in-source config on classic named-`handler` exports,
      // which would make the rateLimit block a silent no-op.
      expect(source, `${endpoint} uses the v2 default export`).toMatch(
        /export default/,
      );
      expect(source, `${endpoint} must not export a named handler`).not.toMatch(
        /export\s+const\s+handler\b/,
      );
    }
  });

  it("documents no dead environment variables", () => {
    const example = read(".env.example");

    for (const dead of [
      "ADMIN_SHIPMENT_TOKEN",
      "DEBUG_ORDERS_ENABLED",
      "DEBUG_ORDERS_TOKEN",
      "HS_PRIVATE_APP_ACCESS_TOKEN",
      "HUBSPOT_API_BASE_URL",
    ]) {
      expect(example, `.env.example still documents ${dead}`).not.toContain(
        dead,
      );
    }

    expect(example).toContain("P24_ALLOW_SANDBOX");
  });

  it("does not track build/test artifacts", () => {
    const gitignore = read(".gitignore");

    expect(gitignore).toContain("*.tsbuildinfo");
    expect(gitignore).toContain(".tmp-*");
    for (const artifact of [".tmp-vitest-full.json", "tsconfig.tsbuildinfo"]) {
      expect(
        existsSync(resolve(ROOT, artifact)),
        `${artifact} should be deleted`,
      ).toBe(false);
    }
  });
});
