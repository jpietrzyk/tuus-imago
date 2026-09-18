import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-version", () => ({
  APP_VERSION: "test-version",
  fetchDeployedVersion: vi.fn().mockResolvedValue(null),
}));

async function loadModules() {
  vi.resetModules();
  const log = await import("@/lib/diagnostics-log");
  const lifecycle = await import("@/lib/diagnostics-lifecycle");
  return {
    ...log,
    ...lifecycle,
  };
}

type LoadedModules = Awaited<ReturnType<typeof loadModules>>;

function lastEntry(modules: LoadedModules, event: string) {
  return [...modules.readDiagnostics()].reverse().find((e) => e.event === event);
}

describe("diagnostics-lifecycle", () => {
  let modules: LoadedModules;
  const cleanups: Array<() => void> = [];

  function track(cleanup: () => void) {
    cleanups.push(cleanup);
    return cleanup;
  }

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    modules = await loadModules();
  });

  afterEach(async () => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("records a boot entry with route, version and load ids", async () => {
    track(modules.initDiagnostics());

    const boot = lastEntry(modules, "boot");
    expect(boot).toBeDefined();
    expect(boot?.kind).toBe("boot");
    expect(boot?.data).toMatchObject({
      runningVersion: "test-version",
      load: modules.getDiagnosticsLoadId(),
      session: modules.getDiagnosticsSessionId(),
      previousEndedCleanly: "none",
    });
    expect(boot?.data?.route).toBe(
      `${window.location.pathname}${window.location.search}`,
    );
  });

  it("marks a clean previous load when it ended with pagehide", async () => {
    modules.recordDiagnostic("pagehide", { kind: "lifecycle" });
    // A browser may append a trailing lifecycle event after pagehide; the
    // previous load must still be classified as clean.
    modules.recordDiagnostic("visibility", {
      kind: "lifecycle",
      detail: "hidden",
    });
    track(modules.initDiagnostics());

    expect(lastEntry(modules, "boot")?.data?.previousEndedCleanly).toBe("yes");
  });

  it("marks an unclean previous load when the last entry was not pagehide", async () => {
    modules.recordDiagnostic("visibility", { kind: "lifecycle" });
    track(modules.initDiagnostics());

    expect(lastEntry(modules, "boot")?.data?.previousEndedCleanly).toBe("no");
  });

  it("logs visibility changes as hidden/visible", () => {
    track(modules.installDiagnosticsListeners(window, document));

    let hidden = false;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));

    const visibilityEntries = modules
      .readDiagnostics()
      .filter((entry) => entry.event === "visibility");
    expect(visibilityEntries.map((entry) => entry.detail)).toEqual([
      "hidden",
      "visible",
    ]);
  });

  it("logs pagehide and pageshow with the bfcache flag", () => {
    track(modules.installDiagnosticsListeners(window, document));

    const pageHide = new Event("pagehide") as Event & { persisted?: boolean };
    pageHide.persisted = true;
    window.dispatchEvent(pageHide);
    const pageShow = new Event("pageshow") as Event & { persisted?: boolean };
    pageShow.persisted = true;
    window.dispatchEvent(pageShow);

    expect(lastEntry(modules, "pagehide")?.data).toEqual({ persisted: true });
    expect(lastEntry(modules, "pageshow")?.data).toEqual({ persisted: true });
  });

  it("logs window errors and unhandled rejections", () => {
    track(modules.installDiagnosticsListeners(window, document));

    window.dispatchEvent(
      new ErrorEvent("error", { message: "boom", filename: "app.js", lineno: 7 }),
    );
    const rejection = new Event("unhandledrejection") as Event & {
      reason?: unknown;
    };
    rejection.reason = "rejected";
    window.dispatchEvent(rejection);

    expect(lastEntry(modules, "window-error")).toMatchObject({
      kind: "error",
      detail: "boom",
      data: { filename: "app.js", lineno: 7 },
    });
    expect(lastEntry(modules, "unhandled-rejection")).toMatchObject({
      kind: "error",
      detail: "rejected",
    });
  });

  it("stops logging after cleanup", () => {
    const cleanup = track(
      modules.installDiagnosticsListeners(window, document),
    );
    cleanup();

    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));

    expect(
      modules.readDiagnostics().filter((entry) => entry.event === "visibility"),
    ).toHaveLength(0);
  });
});
