import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import { AuthProvider } from "@/lib/auth-context";
import { setupServiceWorkerUpdates } from "@/lib/service-worker-updates";
import "./index.css";
import App from "./App.tsx";

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
      setupServiceWorkerUpdates(registration);
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
