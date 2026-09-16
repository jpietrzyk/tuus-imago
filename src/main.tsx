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
import { setupServiceWorkerUpdates } from "@/lib/service-worker-updates";
import { purgeExpiredUploadDraft } from "@/lib/upload-draft-store";
import "./index.css";
import App from "./App.tsx";

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
        getDeployedVersion: async () =>
          (await fetchDeployedVersion())?.version ?? null,
        onOutdated: (deployedVersion) => {
          void forceRefreshIfOutdated(deployedVersion);
        },
      });
    }
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
