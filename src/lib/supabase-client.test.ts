import { describe, it, expect, vi, afterEach } from "vitest";

describe("supabase-client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("creates client when env vars are present", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pk-test-123");

    const mod = await import("./supabase-client");
    expect(mod.supabase).toBeDefined();
    expect(mod.supabase.auth).toBeDefined();
  });

  it("throws when VITE_SUPABASE_URL is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pk-test");

    await expect(import("./supabase-client")).rejects.toThrow(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  });

  it("throws when VITE_SUPABASE_PUBLISHABLE_KEY is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(import("./supabase-client")).rejects.toThrow(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  });
});
