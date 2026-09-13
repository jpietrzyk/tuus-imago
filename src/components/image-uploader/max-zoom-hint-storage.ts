export const MAX_ZOOM_HINT_STORAGE_KEY =
  "tuus-imago:max-zoom-hint-shown";

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasShownMaxZoomHint(): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  try {
    return storage.getItem(MAX_ZOOM_HINT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markMaxZoomHintShown(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(MAX_ZOOM_HINT_STORAGE_KEY, "true");
  } catch {
    // Ignore quota/security errors — the hint is purely informational.
  }
}
