/**
 * Build identity and cache-reset helpers.
 *
 * `__APP_VERSION__` / `__APP_BUILD_TIME__` are injected at build time (see
 * `vite.config.ts`) and also emitted to `/version.json` (served no-cache). A
 * running client can therefore compare the version it was built with against
 * the version the edge is serving, which works even when the service worker
 * would otherwise keep serving a stale precache.
 */

import { recordDiagnostic } from "./diagnostics-log";

export const APP_VERSION: string =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0+test";

export const APP_BUILD_TIME: string =
  typeof __APP_BUILD_TIME__ === "string"
    ? __APP_BUILD_TIME__
    : "1970-01-01T00:00:00.000Z";

export interface DeployedVersion {
  version: string;
  builtAt: string;
}

const FORCED_REFRESH_KEY = "tuus-imago:forced-refresh-version";

export async function fetchDeployedVersion(): Promise<DeployedVersion | null> {
  try {
    const response = await fetch("/version.json", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Partial<DeployedVersion>;
    if (typeof data.version !== "string") {
      return null;
    }

    return {
      version: data.version,
      builtAt: typeof data.builtAt === "string" ? data.builtAt : "",
    };
  } catch {
    return null;
  }
}

export async function unregisterServiceWorkers(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  } catch {
    // Best effort; the reload below still runs.
  }
}

export async function clearAppCaches(): Promise<void> {
  try {
    if (typeof caches === "undefined") {
      return;
    }
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // Cache API may be unavailable; ignore.
  }
}

export async function forceRefreshApp(
  reason = "manual",
): Promise<void> {
  recordDiagnostic("force-refresh", { kind: "reload", detail: reason });
  await unregisterServiceWorkers();
  await clearAppCaches();
  window.location.reload();
}

type RefreshStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Marks that a forced refresh was already attempted for `deployedVersion` in
 * this tab session. Returns true when the caller should refresh. A still-stale
 * edge cannot then trap the app in a reload loop.
 */
export function markForceRefreshAttempted(
  deployedVersion: string,
  storage: RefreshStorage | null = typeof sessionStorage === "undefined"
    ? null
    : sessionStorage,
): boolean {
  if (!storage) {
    return true;
  }

  try {
    if (storage.getItem(FORCED_REFRESH_KEY) === deployedVersion) {
      return false;
    }
    storage.setItem(FORCED_REFRESH_KEY, deployedVersion);
    return true;
  } catch {
    return true;
  }
}

export async function forceRefreshIfOutdated(
  deployedVersion: string,
  storage?: RefreshStorage | null,
): Promise<boolean> {
  if (!markForceRefreshAttempted(deployedVersion, storage)) {
    recordDiagnostic("force-refresh-skipped", {
      kind: "reload",
      detail: "already attempted for this deployed version in this session",
      data: { deployedVersion },
    });
    return false;
  }

  recordDiagnostic("outdated-deployed-version", {
    kind: "version",
    data: { running: APP_VERSION, deployed: deployedVersion },
  });
  await forceRefreshApp("outdated-deployed-version");
  return true;
}
