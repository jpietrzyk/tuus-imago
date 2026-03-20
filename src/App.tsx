import { useState, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import bgDebug from "./assets/testowe.png";
import bgProduction from "./assets/2.png";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  LegalNavigationSheet,
  type LegalMenuSection,
} from "@/components/legal-navigation-sheet";
import { HomeUploadEntryPage } from "./pages/home-upload-entry";
import { LandingPage } from "./pages/landing";
import { UploadPage } from "./pages/upload";
import { AboutPage } from "./pages/about";
import { LegalPage } from "./pages/legal";
import { CheckoutPage } from "./pages/checkout";
import { ConsentsPage } from "./pages/consents";
import { ContactPage } from "./pages/contact";
import { CookiesPage } from "./pages/cookies";
import { PrivacyPage } from "./pages/privacy";
import { ReturnsPage } from "./pages/returns";
import { SecurityPage } from "./pages/security";
import { ShippingPage } from "./pages/shipping";
import { TermsPage } from "./pages/terms";

// Main App Component with Routes
export function App() {
  const [isLegalSheetOpen, setIsLegalSheetOpen] = useState(false);
  const [activeLegalSection, setActiveLegalSection] =
    useState<LegalMenuSection>("legal");
  const [isFooterCheckoutAvailable, setIsFooterCheckoutAvailable] =
    useState(false);
  const [isFooterResetAvailable, setIsFooterResetAvailable] = useState(false);
  const [onFooterReset, setOnFooterReset] = useState<(() => void) | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const openLegalSheet = (section: LegalMenuSection) => {
    setActiveLegalSection(section);
    setIsLegalSheetOpen(true);
  };

  const handleFooterResetActionChange = useCallback(
    (action: (() => void) | null) => {
      setOnFooterReset(() => action);
    },
    [],
  );

  const showFooterCheckout =
    location.pathname === "/upload" && isFooterCheckoutAvailable;
  const showFooterReset =
    location.pathname === "/upload" && isFooterResetAvailable;

  const isDebug = import.meta.env.VITE_SHOW_UPLOADER_DEBUG === "true";
  const [useTestBackground, setUseTestBackground] = useState(isDebug);
  const bgImage = useTestBackground ? bgDebug : bgProduction;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <Header onOpenLegalMenu={openLegalSheet} />
      <main className="flex-1 overflow-auto relative">
        <Routes>
          <Route path="/" element={<HomeUploadEntryPage />} />
          <Route path="/how-it-works" element={<LandingPage />} />
          <Route
            path="/upload"
            element={
              <UploadPage
                onCheckoutAvailabilityChange={setIsFooterCheckoutAvailable}
                onResetAvailabilityChange={setIsFooterResetAvailable}
                onResetActionChange={handleFooterResetActionChange}
              />
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/consents" element={<ConsentsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </main>
      <Footer
        onOpenLegalMenu={() => openLegalSheet("legal")}
        showCheckout={showFooterCheckout}
        onCheckout={() => navigate("/checkout")}
        showReset={showFooterReset}
        onReset={onFooterReset ?? undefined}
      />
      <LegalNavigationSheet
        open={isLegalSheetOpen}
        onOpenChange={setIsLegalSheetOpen}
        activeSection={activeLegalSection}
      />
      {isDebug && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-lg backdrop-blur-sm">
          <span className="select-none">BG:</span>
          <button
            type="button"
            onClick={() => setUseTestBackground((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${useTestBackground ? "bg-amber-500" : "bg-amber-200"}`}
            aria-pressed={useTestBackground}
            aria-label="Toggle test background"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${useTestBackground ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <span className="select-none text-amber-700">
            {useTestBackground ? "test" : "prod"}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
