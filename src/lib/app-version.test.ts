import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_VERSION,
  fetchDeployedVersion,
  markForceRefreshAttempted,
} from "@/lib/app-version";

describe("fetchDeployedVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed build info", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          version: "1.2.3+abc",
          builtAt: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );

    await expect(fetchDeployedVersion()).resolves.toEqual({
      version: "1.2.3+abc",
      builtAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(fetchDeployedVersion()).resolves.toBeNull();
  });

  it("returns null when the payload has no version", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );

    await expect(fetchDeployedVersion()).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchDeployedVersion()).resolves.toBeNull();
  });

  it("exposes a non-empty running version", () => {
    expect(APP_VERSION.length).toBeGreaterThan(0);
  });
});

describe("markForceRefreshAttempted", () => {
  function createStorage() {
    const store = new Map<string, string>();
    return {
      store,
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
  }

  it("returns true the first time and false for the same version", () => {
    const storage = createStorage();

    expect(markForceRefreshAttempted("v2", storage)).toBe(true);
    expect(markForceRefreshAttempted("v2", storage)).toBe(false);
  });

  it("returns true again for a newer deployed version", () => {
    const storage = createStorage();

    expect(markForceRefreshAttempted("v2", storage)).toBe(true);
    expect(markForceRefreshAttempted("v3", storage)).toBe(true);
  });

  it("returns true when storage is unavailable", () => {
    expect(markForceRefreshAttempted("v2", null)).toBe(true);
  });
});
