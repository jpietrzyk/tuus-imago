/**
 * Keeps an installed PWA on the current deploy.
 *
 * Browsers re-check `/sw.js` on navigation (and roughly once a day), so an
 * installed app that is only resumed from the background — e.g. after taking a
 * photo with the native camera — can keep running a stale precached build long
 * after a deploy. Re-checking on visibility/focus/online and on an interval
 * closes that gap. When the fresh worker finally claims the page we reload once
 * so the new assets become active.
 */

const DEFAULT_UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export interface UpdatableRegistration {
  update: () => Promise<unknown>;
}

interface ServiceWorkerLike {
  readonly controller: unknown;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface DocumentLike {
  readonly hidden: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface WindowLike {
  setInterval(handler: () => void, timeout: number): number;
  clearInterval(id: number): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface ServiceWorkerUpdateOptions {
  intervalMs?: number;
  reload?: () => void;
  serviceWorker?: ServiceWorkerLike;
  document?: DocumentLike;
  window?: WindowLike;
  currentVersion?: string;
  getDeployedVersion?: () => Promise<string | null>;
  onOutdated?: (deployedVersion: string, currentVersion: string) => void;
}

export function setupServiceWorkerUpdates(
  registration: UpdatableRegistration,
  options: ServiceWorkerUpdateOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? DEFAULT_UPDATE_CHECK_INTERVAL_MS;
  const serviceWorker =
    options.serviceWorker ??
    (typeof navigator === "undefined" ? undefined : navigator.serviceWorker);
  const doc =
    options.document ??
    (typeof document === "undefined" ? undefined : document);
  const win =
    options.window ?? (typeof window === "undefined" ? undefined : window);
  const reload = options.reload ?? (() => window.location.reload());
  const { currentVersion, getDeployedVersion, onOutdated } = options;

  // Tracks whether a worker has already taken control of this page. Starts
  // false on a first install, where the initial controllerchange only means the
  // worker claimed the page (the bundle that loaded is already current), so it
  // is recorded without reloading. Later controllerchange events are updates.
  let controllerEstablished = Boolean(serviceWorker?.controller);

  const checkDeployedVersion = () => {
    if (!getDeployedVersion) {
      return;
    }

    void getDeployedVersion()
      .then((deployedVersion) => {
        if (deployedVersion && currentVersion && deployedVersion !== currentVersion) {
          if (onOutdated) {
            onOutdated(deployedVersion, currentVersion);
          } else {
            reload();
          }
        }
      })
      .catch(() => {
        // Version identity is best-effort; the service worker check still runs.
      });
  };

  const checkForUpdate = () => {
    void registration.update().catch(() => {
      // Offline or a transient failure; the next trigger retries.
    });
    checkDeployedVersion();
  };

  const handleVisibilityChange = () => {
    if (doc && !doc.hidden) {
      checkForUpdate();
    }
  };

  const handleControllerChange = () => {
    if (!controllerEstablished) {
      controllerEstablished = true;
      return;
    }
    reload();
  };

  const intervalId = win?.setInterval(checkForUpdate, intervalMs);
  doc?.addEventListener("visibilitychange", handleVisibilityChange);
  win?.addEventListener("focus", checkForUpdate);
  win?.addEventListener("online", checkForUpdate);
  serviceWorker?.addEventListener("controllerchange", handleControllerChange);

  return () => {
    if (intervalId !== undefined) {
      win?.clearInterval(intervalId);
    }
    doc?.removeEventListener("visibilitychange", handleVisibilityChange);
    win?.removeEventListener("focus", checkForUpdate);
    win?.removeEventListener("online", checkForUpdate);
    serviceWorker?.removeEventListener(
      "controllerchange",
      handleControllerChange,
    );
  };
}
