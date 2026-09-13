import { useEffect, useState } from "react";

import {
  APP_BUILD_TIME,
  APP_VERSION,
  fetchDeployedVersion,
  forceRefreshApp,
  type DeployedVersion,
} from "@/lib/app-version";

function readBuildFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("build") || params.has("version");
}

/**
 * Debug overlay for checking which build a device is actually running.
 * Only rendered when the URL carries `?build` (or `?version`), so it stays out
 * of the customer experience. Open the site on a phone with `?build` to compare
 * the running build with what the edge serves.
 */
export function BuildVersionBadge() {
  const [enabled] = useState(readBuildFlag);
  const [deployed, setDeployed] = useState<DeployedVersion | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    void fetchDeployedVersion().then((info) => {
      if (!cancelled) {
        setDeployed(info);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const outdated = deployed !== null && deployed.version !== APP_VERSION;

  return (
    <div className="fixed right-2 bottom-2 z-[9999] max-w-[90vw] rounded-md bg-black/85 px-3 py-2 font-mono text-[11px] leading-snug text-white shadow-lg">
      <div>running: {APP_VERSION}</div>
      <div>deployed: {deployed ? deployed.version : "checking…"}</div>
      <div>built: {APP_BUILD_TIME}</div>
      {outdated && (
        <button
          type="button"
          className="mt-1 rounded bg-white/20 px-2 py-0.5"
          onClick={() => {
            void forceRefreshApp();
          }}
        >
          Refresh to update
        </button>
      )}
    </div>
  );
}
