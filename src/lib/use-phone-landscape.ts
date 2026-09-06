import { useSyncExternalStore } from "react";

const PHONE_LANDSCAPE_QUERY =
  "(orientation: landscape) and (max-height: 500px)";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mql = window.matchMedia(PHONE_LANDSCAPE_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia(PHONE_LANDSCAPE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePhoneLandscape(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
