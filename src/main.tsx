import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import { AuthProvider } from "@/lib/auth-context";
import {
  APP_VERSION,
  fetchDeployedVersion,
  forceRefreshIfOutdated,
} from "@/lib/app-version";
import { initDiagnostics } from "@/lib/diagnostics-lifecycle";
import { recordDiagnostic } from "@/lib/diagnostics-log";
import { setupServiceWorkerUpdates } from "@/lib/service-worker-updates";
import { purgeExpiredUploadDraft } from "@/lib/upload-draft-store";
import "./index.css";
import App from "./App.tsx";

// Start the persistent event journal before anything else so the boot entry and
// lifecycle listeners are in place for the very first frames.
initDiagnostics();

// Drop an abandoned upload draft once its retention window has elapsed, so
// stored photos are not kept in the browser indefinitely.
void purgeExpiredUploadDraft();

registerSW({
  immediate: true,
  // Updates reload through the controllerchange listener installed by
  // setupServiceWorkerUpdates, so suppress the plugin's implicit reload to
  // guarantee a single reload per update.
  onNeedReload: () => {
    // Reload handled by setupServiceWorkerUpdates.
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setupServiceWorkerUpdates(registration, {
        currentVersion: APP_VERSION,
        // Only reached for a controllerchange reload (the outdated-version path
        // goes through onOutdated below), so name the reason accordingly.
        reload: () => {
          recordDiagnostic("controllerchange-reload", {
            kind: "reload",
            detail: "a new service worker took control",
          });
          window.location.reload();
        },
        getDeployedVersion: async () => {
          const info = await fetchDeployedVersion();
          recordDiagnostic("version-check", {
            kind: "version",
            data: { running: APP_VERSION, deployed: info?.version ?? null },
          });
          return info?.version ?? null;
        },
        onOutdated: (deployedVersion) => {
          recordDiagnostic("version-outdated", {
            kind: "version",
            data: { running: APP_VERSION, deployed: deployedVersion },
          });
          void forceRefreshIfOutdated(deployedVersion);
        },
      });
    }
  },
  onRegisterError(error) {
    recordDiagnostic("sw-register-error", {
      kind: "service-worker",
      detail: error instanceof Error ? error.message : String(error),
    });
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
