import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadModule() {
  vi.resetModules();
  return import("@/lib/diagnostics-log");
}

describe("diagnostics-log", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(async () => {
    // Let any coalesced flush scheduled by the test run before clearing, so it
    // cannot repopulate storage during the next test.
    await new Promise((resolve) => setTimeout(resolve, 0));
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("records and reads back entries", async () => {
    const { recordDiagnostic, readDiagnostics } = await loadModule();

    recordDiagnostic("camera-dialog-open", {
      kind: "camera",
      detail: "capture",
      data: { attempt: 1 },
    });

    const entries = readDiagnostics();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "camera",
      event: "camera-dialog-open",
      detail: "capture",
      data: { attempt: 1 },
    });
    expect(typeof entries[0].at).toBe("number");
    expect(entries[0].session.length).toBeGreaterThan(0);
    expect(entries[0].load.length).toBeGreaterThan(0);
  });

  it("keeps at most DIAGNOSTICS_MAX_ENTRIES entries (ring buffer)", async () => {
    const { recordDiagnostic, readDiagnostics, DIAGNOSTICS_MAX_ENTRIES } =
      await loadModule();

    for (let index = 0; index < DIAGNOSTICS_MAX_ENTRIES + 25; index += 1) {
      recordDiagnostic(`event-${index}`);
    }

    const entries = readDiagnostics();
    expect(entries).toHaveLength(DIAGNOSTICS_MAX_ENTRIES);
    expect(entries[entries.length - 1].event).toBe(
      `event-${DIAGNOSTICS_MAX_ENTRIES + 24}`,
    );
    expect(entries[0].event).toBe("event-25");
  });

  it("clears the journal", async () => {
    const { recordDiagnostic, readDiagnostics, clearDiagnostics } =
      await loadModule();

    recordDiagnostic("boot");
    clearDiagnostics();

    expect(readDiagnostics()).toEqual([]);
  });

  it("notifies subscribers when the journal changes", async () => {
    const { recordDiagnostic, subscribeDiagnostics } = await loadModule();
    const listener = vi.fn();

    const unsubscribe = subscribeDiagnostics(listener);
    recordDiagnostic("boot");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    recordDiagnostic("route");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps the session id stable and persists it in sessionStorage", async () => {
    const { getDiagnosticsSessionId, DIAGNOSTICS_SESSION_KEY } =
      await loadModule();

    const first = getDiagnosticsSessionId();
    expect(sessionStorage.getItem(DIAGNOSTICS_SESSION_KEY)).toBe(first);
    expect(getDiagnosticsSessionId()).toBe(first);
  });

  it("never throws when storage writes fail", async () => {
    const { recordDiagnostic, readDiagnostics, flushDiagnostics } =
      await loadModule();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => recordDiagnostic("boot")).not.toThrow();
    expect(() => flushDiagnostics()).not.toThrow();
    vi.restoreAllMocks();
    expect(readDiagnostics()).toHaveLength(1);
  });

  it("redacts credential-bearing query params from routes", async () => {
    const { sanitizeDiagnosticRoute } = await loadModule();

    expect(
      sanitizeDiagnosticRoute(
        "/auth/callback",
        "?code=secret-code&next=%2Fupload",
      ),
    ).toBe("/auth/callback?code=redacted&next=%2Fupload");
    expect(sanitizeDiagnosticRoute("/prepare-painting", "?diag")).toBe(
      "/prepare-painting?diag",
    );
    expect(sanitizeDiagnosticRoute("/upload", "")).toBe("/upload");
  });

  it("truncates oversized detail and data strings", async () => {
    const { recordDiagnostic, readDiagnostics } = await loadModule();
    const huge = "x".repeat(5000);

    recordDiagnostic("unhandled-rejection", {
      detail: huge,
      data: { reason: huge },
    });

    const [entry] = readDiagnostics();
    expect(entry.detail?.length).toBeLessThanOrEqual(501);
    expect(String(entry.data?.reason).length).toBeLessThanOrEqual(201);
  });

  it("persists pending entries when flushed", async () => {
    const { recordDiagnostic, flushDiagnostics, DIAGNOSTICS_STORAGE_KEY } =
      await loadModule();

    recordDiagnostic("boot");
    flushDiagnostics();

    const raw = localStorage.getItem(DIAGNOSTICS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  it("ignores corrupted journal payloads", async () => {
    const { readDiagnostics, DIAGNOSTICS_STORAGE_KEY } = await loadModule();
    localStorage.setItem(DIAGNOSTICS_STORAGE_KEY, "{not json");

    expect(readDiagnostics()).toEqual([]);
  });
});
