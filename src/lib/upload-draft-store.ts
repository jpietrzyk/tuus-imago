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
}

export async function loadUploadDraft(): Promise<UploadDraft | null> {
  const record = await runTransaction<unknown>("readonly", (store) =>
    store.get(DRAFT_KEY),
  );
  return isDraftRecord(record) ? record : null;
}

export async function clearUploadDraft(): Promise<void> {
  await runTransaction("readwrite", (store) => {
    store.delete(DRAFT_KEY);
  });
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
