import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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

interface DebugToggleProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  ariaLabel: string;
  activeText: string;
  inactiveText: string;
}

function DebugToggle({
  label,
  value,
  onToggle,
  ariaLabel,
  activeText,
  inactiveText,
}: DebugToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="select-none min-w-12">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${value ? "bg-amber-500" : "bg-amber-200"}`}
        aria-pressed={value}
        aria-label={ariaLabel}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="select-none text-amber-700">
        {value ? activeText : inactiveText}
      </span>
    </div>
  );
}

// Main App Component with Routes
export function App() {
  const [isLegalSheetOpen, setIsLegalSheetOpen] = useState(false);
  const [activeLegalSection, setActiveLegalSection] =
    useState<LegalMenuSection>("legal");
  const [isFooterUploadAvailable, setIsFooterUploadAvailable] = useState(false);
  const [isFooterUploadPending, setIsFooterUploadPending] = useState(false);
  const [isFooterCheckoutAvailable, setIsFooterCheckoutAvailable] =
    useState(false);
  const [isFooterResetAvailable, setIsFooterResetAvailable] = useState(false);
  const [onFooterReset, setOnFooterReset] = useState<(() => void) | null>(null);
  const [onFooterUpload, setOnFooterUpload] = useState<(() => void) | null>(
    null,
  );
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

  const handleFooterUploadActionChange = useCallback(
    (action: (() => void) | null) => {
      setOnFooterUpload(() => action);
    },
    [],
  );

  const showFooterUpload =
    location.pathname === "/upload" &&
    isFooterUploadAvailable &&
    !isFooterCheckoutAvailable;
  const showFooterCheckout =
    location.pathname === "/upload" && isFooterCheckoutAvailable;
  const showFooterReset =
    location.pathname === "/upload" && isFooterResetAvailable;

  const isDebug = import.meta.env.VITE_SHOW_UPLOADER_DEBUG === "true";
  const [useTestBackground, setUseTestBackground] = useState(false);
  const [showUploaderDebugData, setShowUploaderDebugData] = useState(false);
  const [bgDebugUrl, setBgDebugUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isDebug || !useTestBackground || bgDebugUrl) {
      return;
    }

    let isCancelled = false;

    void import("./assets/testowe.png").then((module) => {
      if (!isCancelled) {
        setBgDebugUrl(module.default);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isDebug, useTestBackground, bgDebugUrl]);

  const bgImage = useTestBackground && bgDebugUrl ? bgDebugUrl : bgProduction;

  return (
    <div
      className="h-screen overflow-hidden flex flex-col bg-background"
      style={{
        backgroundColor: "var(--background)",
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
                onUploadAvailabilityChange={setIsFooterUploadAvailable}
                onUploadActionChange={handleFooterUploadActionChange}
                onUploadPendingChange={setIsFooterUploadPending}
                onCheckoutAvailabilityChange={setIsFooterCheckoutAvailable}
                onResetAvailabilityChange={setIsFooterResetAvailable}
                onResetActionChange={handleFooterResetActionChange}
                imageDebugDataEnabled={showUploaderDebugData}
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
        showUpload={showFooterUpload}
        onUpload={onFooterUpload ?? undefined}
        isUploadPending={isFooterUploadPending}
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
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-lg backdrop-blur-sm">
          <DebugToggle
            label="BG:"
            value={useTestBackground}
            onToggle={() => setUseTestBackground((value) => !value)}
            ariaLabel="Toggle test background"
            activeText="test"
            inactiveText="prod"
          />
          <DebugToggle
            label="IMG:"
            value={showUploaderDebugData}
            onToggle={() => setShowUploaderDebugData((value) => !value)}
            ariaLabel="Toggle uploader image debug data"
            activeText="debug"
            inactiveText="off"
          />
        </div>
      )}
    </div>
  );
}

export default App;
