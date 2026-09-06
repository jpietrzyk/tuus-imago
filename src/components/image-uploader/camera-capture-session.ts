/**
 * Tracks file-selection sessions across page reloads.
 *
 * On mobile, opening the native camera or gallery picker (via <input
 * type="file">) backgrounds the browser. The OS frequently kills the renderer
 * to reclaim memory, so when the user returns with the photo the tab reloads —
 * the file result and any rendered validation error are lost, and the user
 * lands on a pristine upload page with no clue what happened.
 *
 * Two sessionStorage entries survive such a reload:
 *  - a "selection pending" marker written when the camera/picker opens, and
 *  - the last selection validation error written when a file is rejected.
 *
 * On the next mount the uploader consumes them: a fresh marker means the file
 * never arrived (interrupted selection), while a persisted error means a file
 * was rejected right before the reload. Both are surfaced as the inline
 * selection error banner.
 */

const CAPTURE_PENDING_KEY = "uploader-camera-capture-pending";
const SELECTION_ERROR_KEY = "uploader-selection-error";
const MAX_ENTRY_AGE_MS = 5 * 60 * 1000;

export type CaptureSource = "camera" | "gallery";

interface TimestampedEntry {
  savedAt: number;
}

interface CapturePendingEntry extends TimestampedEntry {
  source: CaptureSource;
}

interface PersistedSelectionError extends TimestampedEntry {
  message: string;
}

function readEntry<T extends TimestampedEntry>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as T;
    if (typeof parsed?.savedAt !== "number") {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeEntry<T extends TimestampedEntry>(key: string, entry: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage may be unavailable (private mode, quota); detection is best-effort.
  }
}

function removeEntry(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

function isFresh(entry: TimestampedEntry): boolean {
  return Date.now() - entry.savedAt <= MAX_ENTRY_AGE_MS;
}

export function markCaptureStarted(source: CaptureSource): void {
  writeEntry(CAPTURE_PENDING_KEY, { savedAt: Date.now(), source });
}

export function clearCapturePending(): void {
  removeEntry(CAPTURE_PENDING_KEY);
}

/**
 * Returns the selection source when a camera/gallery session was opened
 * recently but no file ever arrived — i.e. the page was reloaded while the
 * picker was open. Consumes the marker.
 */
export function consumeInterruptedCapture(): CaptureSource | null {
  const entry = readEntry<CapturePendingEntry>(CAPTURE_PENDING_KEY);
  removeEntry(CAPTURE_PENDING_KEY);

  if (!entry || !isFresh(entry)) {
    return null;
  }

  return entry.source === "camera" || entry.source === "gallery"
    ? entry.source
    : null;
}

export function persistSelectionError(message: string): void {
  writeEntry(SELECTION_ERROR_KEY, { savedAt: Date.now(), message });
}

export function clearPersistedSelectionError(): void {
  removeEntry(SELECTION_ERROR_KEY);
}

/**
 * Returns the persisted selection error when it is recent enough to still be
 * relevant after a reload. Always consumes the entry.
 */
export function consumePersistedSelectionError(): string | null {
  const entry = readEntry<PersistedSelectionError>(SELECTION_ERROR_KEY);
  removeEntry(SELECTION_ERROR_KEY);

  if (!entry || !isFresh(entry) || typeof entry.message !== "string") {
    return null;
  }

  return entry.message;
}
