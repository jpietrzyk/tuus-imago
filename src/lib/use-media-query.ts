import { useSyncExternalStore } from "react";

function getSnapshot(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(query).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(query: string, callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * Falls back to `false` when `window`/`matchMedia` is unavailable (e.g. during
 * server-side rendering or in test environments without a mocked matchMedia).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
