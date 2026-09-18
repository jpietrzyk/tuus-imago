/**
 * Persistent in-app event journal ("black box").
 *
 * Symptom this exists for: an intermittent full page reload during the camera /
 * upload flow on production, where the phone gives no access to the console.
 * The journal is an append-only ring buffer persisted to localStorage, so the
 * sequence of lifecycle, service-worker, version and camera events recorded
 * *before* a reload is still readable *after* it (through the `?diag` overlay).
 *
 * Constraints:
 *  - every storage access is guarded, so the journal can never break the app,
 *  - the buffer is bounded in both entry count and entry size,
 *  - entries are held in memory and flushed with a coalesced write so a burst
 *    of lifecycle events does not trigger repeated synchronous storage I/O,
 *  - callers pass short labels/flags only — never file contents or user data,
 *    and route strings are passed through `sanitizeDiagnosticRoute`.
 */

export type DiagnosticKind =
  | "boot"
  | "route"
  | "lifecycle"
  | "version"
  | "service-worker"
  | "reload"
  | "camera"
  | "file"
  | "upload"
  | "error"
  | "note";

export type DiagnosticDataValue = string | number | boolean | null;

export interface DiagnosticEntry {
  /** Epoch milliseconds. */
  at: number;
  kind: DiagnosticKind;
  event: string;
  detail?: string;
  data?: Record<string, DiagnosticDataValue>;
  /** Stable for the lifetime of the tab (survives reloads). */
  session: string;
  /** Stable for one document load; changes on every full reload. */
  load: string;
}

export interface RecordDiagnosticOptions {
  kind?: DiagnosticKind;
  detail?: string;
  data?: Record<string, DiagnosticDataValue>;
}

export const DIAGNOSTICS_STORAGE_KEY = "tuus-imago:diagnostics-log";
export const DIAGNOSTICS_SESSION_KEY = "tuus-imago:diagnostics-session";
export const DIAGNOSTICS_EVENT_NAME = "tuus-imago:diagnostics-recorded";
export const DIAGNOSTICS_MAX_ENTRIES = 300;

const MAX_DETAIL_LENGTH = 500;
const MAX_DATA_STRING_LENGTH = 200;

/**
 * Query params that can carry credentials or session material. Values are
 * replaced before the route is journaled; the key itself stays for context.
 */
const SENSITIVE_QUERY_KEYS = new Set([
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "id_token",
  "session",
  "state",
  "error_description",
]);

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function createId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    // crypto unavailable; fall back to Math.random below.
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Builds a journal-safe route string: the pathname plus the query string with
 * any credential-bearing parameters redacted. Never returns the raw search.
 */
export function sanitizeDiagnosticRoute(
  pathname: string,
  search: string,
): string {
  if (!search) {
    return pathname;
  }

  try {
    const params = new URLSearchParams(search);
    let redacted = false;
    for (const key of Array.from(params.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        params.set(key, "redacted");
        redacted = true;
      }
    }
    if (!redacted) {
      return `${pathname}${search}`;
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  } catch {
    // A malformed query must never leak; fall back to the pathname alone.
    return pathname;
  }
}

// One id per module evaluation == one document load. A full page reload
// re-evaluates the module, so `load` changes exactly when the page reloaded.
const LOAD_ID = createId();

function getStorage(kind: "local" | "session"): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Storage can be blocked (private mode, security settings).
    return null;
  }
}

let cachedSessionId: string | null = null;

/** Tab-scoped id used to correlate entries across reloads. */
export function getDiagnosticsSessionId(): string {
  if (cachedSessionId) {
    return cachedSessionId;
  }

  const storage = getStorage("session");
  if (storage) {
    try {
      const existing = storage.getItem(DIAGNOSTICS_SESSION_KEY);
      if (existing) {
        cachedSessionId = existing;
        return existing;
      }
      const created = createId();
      storage.setItem(DIAGNOSTICS_SESSION_KEY, created);
      cachedSessionId = created;
      return created;
    } catch {
      // Fall through to an ephemeral id.
    }
  }

  cachedSessionId = createId();
  return cachedSessionId;
}

/** Document-load-scoped id; differs between two entries only after a reload. */
export function getDiagnosticsLoadId(): string {
  return LOAD_ID;
}

function isDiagnosticEntry(value: unknown): value is DiagnosticEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Partial<DiagnosticEntry>;
  return typeof entry.at === "number" && typeof entry.event === "string";
}

// In-memory source of truth. Reading localStorage once per call (and parsing
// the whole journal) on every lifecycle event is the expensive part; writes are
// coalesced below.
let journalCache: DiagnosticEntry[] | null = null;

function loadJournal(): DiagnosticEntry[] {
  if (journalCache) {
    return journalCache;
  }

  const storage = getStorage("local");
  if (!storage) {
    journalCache = [];
    return journalCache;
  }

  try {
    const raw = storage.getItem(DIAGNOSTICS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    journalCache = Array.isArray(parsed) ? parsed.filter(isDiagnosticEntry) : [];
  } catch {
    journalCache = [];
  }
  return journalCache;
}

export function readDiagnostics(): DiagnosticEntry[] {
  return loadJournal().slice();
}

function writeJournal(): void {
  const storage = getStorage("local");
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      DIAGNOSTICS_STORAGE_KEY,
      JSON.stringify(loadJournal()),
    );
  } catch {
    // Quota/private mode: diagnostics are best-effort and never break the app.
  }
}

let flushScheduled = false;

function scheduleDiagnosticsFlush(): void {
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;

  const run = () => {
    flushScheduled = false;
    writeJournal();
  };

  try {
    setTimeout(run, 0);
  } catch {
    run();
  }
}

/**
 * Persists any pending entries immediately. Called before the document can be
 * torn down (pagehide / hidden) so an in-flight journal survives a reload.
 */
export function flushDiagnostics(): void {
  flushScheduled = false;
  writeJournal();
}

let subscriberCount = 0;

function notifyDiagnosticsChanged(): void {
  if (subscriberCount === 0) {
    return;
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DIAGNOSTICS_EVENT_NAME));
    }
  } catch {
    // No usable window (SSR/tests); nothing to notify.
  }
}

function sanitizeData(
  data: Record<string, DiagnosticDataValue> | undefined,
): Record<string, DiagnosticDataValue> | undefined {
  if (!data) {
    return undefined;
  }

  const sanitized: Record<string, DiagnosticDataValue> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] =
      typeof value === "string" ? truncate(value, MAX_DATA_STRING_LENGTH) : value;
  }
  return sanitized;
}

export function recordDiagnostic(
  event: string,
  options: RecordDiagnosticOptions = {},
): void {
  const entry: DiagnosticEntry = {
    at: Date.now(),
    kind: options.kind ?? "note",
    event,
    session: getDiagnosticsSessionId(),
    load: LOAD_ID,
  };

  if (options.detail) {
    entry.detail = truncate(options.detail, MAX_DETAIL_LENGTH);
  }
  const data = sanitizeData(options.data);
  if (data) {
    entry.data = data;
  }

  const entries = loadJournal();
  entries.push(entry);
  if (entries.length > DIAGNOSTICS_MAX_ENTRIES) {
    entries.splice(0, entries.length - DIAGNOSTICS_MAX_ENTRIES);
  }

  scheduleDiagnosticsFlush();
  notifyDiagnosticsChanged();
}

export function clearDiagnostics(): void {
  journalCache = [];
  const storage = getStorage("local");
  if (storage) {
    try {
      storage.removeItem(DIAGNOSTICS_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
  notifyDiagnosticsChanged();
}

/**
 * Notifies when the journal changes so a visible overlay can re-read it.
 * Returns an unsubscribe function. Notifications are skipped entirely while
 * nobody is subscribed (the common production case).
 */
export function subscribeDiagnostics(listener: () => void): () => void {
  try {
    if (typeof window === "undefined") {
      return () => {};
    }
    window.addEventListener(DIAGNOSTICS_EVENT_NAME, listener);
    subscriberCount += 1;
    return () => {
      window.removeEventListener(DIAGNOSTICS_EVENT_NAME, listener);
      subscriberCount = Math.max(0, subscriberCount - 1);
    };
  } catch {
    return () => {};
  }
}
