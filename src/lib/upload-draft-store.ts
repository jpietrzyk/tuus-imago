/**
 * Durable storage for the in-progress upload/edit draft.
 *
 * The user's work before an order is placed (the original photo, crop, zoom,
 * rotation, effects, triptych windows, selected painting size) lives only in
 * React state, which is destroyed by any full page unload — an OAuth login
 * redirect, an accidental refresh, or a mobile OS killing a backgrounded tab.
 *
 * IndexedDB is used because it is the only browser store that can hold the
 * original image blobs and is shared across tabs of the same origin (so a
 * login completed in a new tab is still seen by the original tab). Every
 * operation degrades to a no-op when IndexedDB is unavailable.
 */

const DB_NAME = "tuus-imago";
const DB_VERSION = 1;
const STORE_NAME = "upload-draft";
const DRAFT_KEY = "current";
/**
 * Lightweight copy of the draft's `updatedAt`, kept in localStorage so an
 * expired draft can be purged without reading the (potentially tens of MB)
 * IndexedDB record that holds the image bytes.
 */
const TIMESTAMP_KEY = "upload-draft-updated-at";

/**
 * Default retention for an in-progress draft. After this long without any
 * edit (no OAuth in between, no upload, no order), the draft is considered
 * abandoned and its photos are removed from the browser. Override with
 * `VITE_UPLOAD_DRAFT_MAX_AGE_HOURS`.
 */
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getUploadDraftMaxAgeMs(): number {
  const raw = import.meta.env.VITE_UPLOAD_DRAFT_MAX_AGE_HOURS;
  const hours = typeof raw === "string" ? Number(raw) : NaN;
  if (Number.isFinite(hours) && hours > 0) {
    return hours * 60 * 60 * 1000;
  }
  return DEFAULT_MAX_AGE_MS;
}

function readTimelineMarker(): number | null {
  try {
    const raw = localStorage.getItem(TIMESTAMP_KEY);
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeTimelineMarker(updatedAt: number): void {
  try {
    localStorage.setItem(TIMESTAMP_KEY, String(updatedAt));
  } catch {
    // localStorage may be unavailable; expiry then falls back to the record.
  }
}

function removeTimelineMarker(): void {
  try {
    localStorage.removeItem(TIMESTAMP_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function isExpired(updatedAt: number): boolean {
  return Date.now() - updatedAt > getUploadDraftMaxAgeMs();
}

export interface UploadDraftEffects {
  brightness: number;
  contrast: number;
  grayscale: number;
  removeBackground?: boolean;
  enhance?: boolean;
  upscale?: boolean;
  restore?: boolean;
}

export interface UploadDraftTransform {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface UploadDraftCropAdjust {
  zoom: number;
  panX: number;
  panY: number;
}

export type UploadDraftProportion =
  | "horizontal"
  | "vertical"
  | "square"
  | "rectangle";

export interface UploadDraftMetadata {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface UploadDraftImage {
  slotIndex: number;
  /**
   * Original file bytes. Stored as an ArrayBuffer rather than a Blob because
   * Blob support in IndexedDB has historically been inconsistent across
   * browsers. Absent for slots restored from a cloud asset.
   */
  bytes?: ArrayBuffer;
  fileName?: string;
  fileType?: string;
  fileLastModified?: number;
  /** Preview URL for slots that have no local blob (an uploaded cloud URL). */
  previewUrl?: string;
  metadata: UploadDraftMetadata | null;
  displayImageProportion: UploadDraftProportion;
  previewEffects: UploadDraftEffects;
  previewTransform?: UploadDraftTransform;
  previewCropAdjust?: UploadDraftCropAdjust;
  triptychWindowIndex?: number;
  uploadedAsset?: {
    publicId: string;
    secureUrl: string;
    sourceFingerprint: string;
  };
}

export interface UploadDraft {
  updatedAt: number;
  activeImageIndex: number | null;
  isTriptychSplit: boolean;
  isTriptychLinked: boolean;
  selectedPaintingSizeIndex: number;
  images: UploadDraftImage[];
}

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) {
    return Promise.resolve(null);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(STORE_NAME, mode);
          transaction.oncomplete = () => resolve(null);
          transaction.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
          const request = run(transaction.objectStore(STORE_NAME));

          if (request) {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
          }
        } catch {
          resolve(null);
        }
      }),
  );
}

function isDraftRecord(value: unknown): value is UploadDraft {
  if (!value || typeof value !== "object") {
    return false;
  }
  const draft = value as Partial<UploadDraft>;
  return typeof draft.updatedAt === "number" && Array.isArray(draft.images);
}

export async function saveUploadDraft(draft: UploadDraft): Promise<void> {
  await runTransaction("readwrite", (store) => {
    store.put(draft, DRAFT_KEY);
  });
  writeTimelineMarker(draft.updatedAt);
}

export async function loadUploadDraft(): Promise<UploadDraft | null> {
  // Cheap expiry check first: when the marker says the draft is stale, drop it
  // without reading the (potentially tens of MB) photo record.
  const marker = readTimelineMarker();
  if (marker !== null && isExpired(marker)) {
    await clearUploadDraft();
    return null;
  }

  const record = await runTransaction<unknown>("readonly", (store) =>
    store.get(DRAFT_KEY),
  );
  if (!isDraftRecord(record)) {
    return null;
  }
  if (isExpired(record.updatedAt)) {
    await clearUploadDraft();
    return null;
  }
  return record;
}

export async function clearUploadDraft(): Promise<void> {
  removeTimelineMarker();
  await runTransaction("readwrite", (store) => {
    store.delete(DRAFT_KEY);
  });
}

/**
 * Removes an abandoned draft whose retention window has elapsed. Cheap: uses
 * the localStorage marker and never reads the heavy record unless a purge is
 * actually required. Safe to call on every app start.
 */
export async function purgeExpiredUploadDraft(): Promise<boolean> {
  const marker = readTimelineMarker();
  if (marker === null || !isExpired(marker)) {
    return false;
  }
  await clearUploadDraft();
  return true;
}

/**
 * sessionStorage key holding the successfully uploaded slots used to rebuild
 * the flow after a reload. Shared so App and checkout clear the same entry.
 */
export const UPLOAD_SLOTS_STORAGE_KEY = "upload-uploaded-slots";

/**
 * Clears every persisted upload artefact. Called once the work is finished
 * (order placed) so a later visit starts clean.
 */
export function clearPersistedUploadWork(): void {
  try {
    sessionStorage.removeItem(UPLOAD_SLOTS_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable.
  }
  void clearUploadDraft();
}
