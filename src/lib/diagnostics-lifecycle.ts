/**
 * Wires the diagnostics journal to the browser lifecycle so a reload can be
 * explained after the fact.
 *
 * `initDiagnostics()` records a `boot` entry that captures how the current
 * document was reached (navigate/reload/back_forward), which route and build it
 * is running, and whether the *previous* page load ended through a clean
 * `pagehide` or just vanished (which is what a killed mobile renderer looks
 * like). It then installs listeners for visibility/focus/pageshow/pagehide and
 * uncaught errors, all of which land in the same persistent journal.
 *
 * Deliberately no `beforeunload` listener: it can make a page ineligible for
 * the back/forward cache in some browsers, which would itself change behaviour.
 */

import { APP_VERSION } from "./app-version";
import {
  flushDiagnostics,
  getDiagnosticsLoadId,
  getDiagnosticsSessionId,
  readDiagnostics,
  recordDiagnostic,
  sanitizeDiagnosticRoute,
} from "./diagnostics-log";

function readNavigationType(): string {
  try {
    const entries = performance.getEntriesByType?.("navigation");
    const navigation = entries?.[0] as
      | PerformanceNavigationTiming
      | undefined;
    return navigation?.type ?? "unknown";
  } catch {
    return "unknown";
  }
}

function readDisplayMode(): string {
  try {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(display-mode: standalone)").matches
    ) {
      return "standalone";
    }
  } catch {
    // matchMedia unavailable; treat as a browser tab.
  }
  return "browser";
}

export interface DiagnosticsInitOptions {
  window?: Window;
  document?: Document;
}

export function installDiagnosticsListeners(
  win: Window,
  doc: Document,
): () => void {
  const onVisibilityChange = () => {
    const hidden = doc.hidden;
    recordDiagnostic("visibility", {
      kind: "lifecycle",
      detail: hidden ? "hidden" : "visible",
    });
    // Backgrounding may be followed by an OS kill with no further events, so
    // persist immediately instead of waiting for the coalesced flush.
    if (hidden) {
      flushDiagnostics();
    }
  };
  const onFocus = () => recordDiagnostic("focus", { kind: "lifecycle" });
  const onBlur = () => recordDiagnostic("blur", { kind: "lifecycle" });
  const onPageShow = (event: Event) =>
    recordDiagnostic("pageshow", {
      kind: "lifecycle",
      data: { persisted: (event as PageTransitionEvent).persisted ?? false },
    });
  const onPageHide = (event: Event) => {
    recordDiagnostic("pagehide", {
      kind: "lifecycle",
      data: { persisted: (event as PageTransitionEvent).persisted ?? false },
    });
    // Last chance to persist before the document is discarded.
    flushDiagnostics();
  };
  const onOnline = () => recordDiagnostic("online", { kind: "lifecycle" });
  const onOffline = () => recordDiagnostic("offline", { kind: "lifecycle" });
  const onError = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    recordDiagnostic("window-error", {
      kind: "error",
      detail: errorEvent.message ?? "unknown",
      data: {
        filename: errorEvent.filename ?? null,
        lineno: typeof errorEvent.lineno === "number" ? errorEvent.lineno : null,
      },
    });
  };
  const onUnhandledRejection = (event: Event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    let detail: string;
    try {
      detail =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? reason.message
            : JSON.stringify(reason);
    } catch {
      detail = "unserializable rejection";
    }
    recordDiagnostic("unhandled-rejection", { kind: "error", detail });
  };

  doc.addEventListener("visibilitychange", onVisibilityChange);
  win.addEventListener("focus", onFocus);
  win.addEventListener("blur", onBlur);
  win.addEventListener("pageshow", onPageShow);
  win.addEventListener("pagehide", onPageHide);
  win.addEventListener("online", onOnline);
  win.addEventListener("offline", onOffline);
  win.addEventListener("error", onError);
  win.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    doc.removeEventListener("visibilitychange", onVisibilityChange);
    win.removeEventListener("focus", onFocus);
    win.removeEventListener("blur", onBlur);
    win.removeEventListener("pageshow", onPageShow);
    win.removeEventListener("pagehide", onPageHide);
    win.removeEventListener("online", onOnline);
    win.removeEventListener("offline", onOffline);
    win.removeEventListener("error", onError);
    win.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

/**
 * Records the boot entry and installs lifecycle listeners. Call once, as early
 * as possible in the entry point (before the app renders).
 */
export function initDiagnostics(
  options: DiagnosticsInitOptions = {},
): () => void {
  const win =
    options.window ?? (typeof window === "undefined" ? undefined : window);
  const doc =
    options.document ?? (typeof document === "undefined" ? undefined : document);

  const previousEntries = readDiagnostics();
  const previousEntry = previousEntries[previousEntries.length - 1] ?? null;
  // A clean unload always records `pagehide`, but browsers may append a trailing
  // `visibility`/`blur` around it, so inspect the whole previous load instead of
  // only the final entry.
  const previousLoadEntries = previousEntry
    ? previousEntries.filter((entry) => entry.load === previousEntry.load)
    : [];
  const previousEndedCleanly =
    previousEntry === null
      ? "none"
      : previousLoadEntries.some((entry) => entry.event === "pagehide")
        ? "yes"
        : "no";

  recordDiagnostic("boot", {
    kind: "boot",
    data: {
      navType: readNavigationType(),
      route: sanitizeDiagnosticRoute(
        win?.location?.pathname ?? "",
        win?.location?.search ?? "",
      ),
      runningVersion: APP_VERSION,
      displayMode: readDisplayMode(),
      online: win?.navigator?.onLine ?? null,
      session: getDiagnosticsSessionId(),
      load: getDiagnosticsLoadId(),
      previousEndedCleanly,
      previousEvent: previousEntry?.event ?? null,
      previousLoad: previousEntry?.load ?? null,
      previousAt: previousEntry?.at ?? null,
    },
  });

  const cleanup = win && doc ? installDiagnosticsListeners(win, doc) : () => {};
  return cleanup;
}
