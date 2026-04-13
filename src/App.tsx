import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
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
import {
  type OrderableSlotSummary,
  type UploadSlotKey,
  type UploadedSlotResult,
} from "@/components/image-uploader";
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
import { PaymentsPage } from "./pages/payments";
import { ComplaintPage } from "./pages/complaint";
import { CANVAS_PRINT_UNIT_PRICE } from "@/lib/pricing";
import { getPageBySlug } from "@/lib/content-loader";
import { ContentPageOverlay } from "@/components/content-page-overlay";

const UPLOAD_SLOTS_STORAGE = "upload-uploaded-slots";

function persistUploadSlots(slots: UploadedSlotResult[]) {
  try {
    if (slots.length > 0) {
      sessionStorage.setItem(UPLOAD_SLOTS_STORAGE, JSON.stringify(slots));
    } else {
      sessionStorage.removeItem(UPLOAD_SLOTS_STORAGE);
    }
  } catch {
    // sessionStorage may be unavailable in private browsing or quota exceeded
  }
}

function restoreUploadSlots(): UploadedSlotResult[] {
  try {
    const saved = sessionStorage.getItem(UPLOAD_SLOTS_STORAGE);
    if (saved) {
      return JSON.parse(saved) as UploadedSlotResult[];
    }
  } catch {
    // sessionStorage may be unavailable or data corrupted
  }
  return [];
}

function clearUploadSlots() {
  try {
    sessionStorage.removeItem(UPLOAD_SLOTS_STORAGE);
  } catch {
    // ignore
  }
}
import { AuthPage } from "./pages/auth";
import { AuthCallbackPage } from "./pages/auth-callback";
import { ResetPasswordPage } from "./pages/auth-reset-password";
import { UpdatePasswordPage } from "./pages/auth-update-password";
import { AccountPage } from "./pages/account";
import { ProtectedRoute } from "@/components/protected-route";
import { setReferralCookie } from "@/lib/referral-cookie";
import { useReferralTracking } from "@/lib/use-referral-tracking";
import { Authenticated } from "@refinedev/core";
import { AdminApp } from "./admin/AdminApp";
import { AdminLayout } from "./admin/layout";
import { AdminLoginPage } from "./admin/login";

const DashboardPage = lazy(() => import("./admin/pages/dashboard").then((m) => ({ default: m.DashboardPage })));
const OrderListPage = lazy(() => import("./admin/pages/order-list").then((m) => ({ default: m.OrderListPage })));
const OrderShowPage = lazy(() => import("./admin/pages/order-show").then((m) => ({ default: m.OrderShowPage })));
const CouponListPage = lazy(() => import("./admin/pages/coupon-list").then((m) => ({ default: m.CouponListPage })));
const CouponCreatePage = lazy(() => import("./admin/pages/coupon-create").then((m) => ({ default: m.CouponCreatePage })));
const CouponEditPage = lazy(() => import("./admin/pages/coupon-edit").then((m) => ({ default: m.CouponEditPage })));
const CouponShowPage = lazy(() => import("./admin/pages/coupon-show").then((m) => ({ default: m.CouponShowPage })));
const CustomerListPage = lazy(() => import("./admin/pages/customer-list").then((m) => ({ default: m.CustomerListPage })));
const CustomerShowPage = lazy(() => import("./admin/pages/customer-show").then((m) => ({ default: m.CustomerShowPage })));
const AdminUsersPage = lazy(() => import("./admin/pages/admin-users-list").then((m) => ({ default: m.AdminUsersPage })));
const AdminUserShowPage = lazy(() => import("./admin/pages/admin-user-show").then((m) => ({ default: m.AdminUserShowPage })));
const PartnerListPage = lazy(() => import("./admin/pages/partner-list").then((m) => ({ default: m.PartnerListPage })));
const PartnerShowPage = lazy(() => import("./admin/pages/partner-show").then((m) => ({ default: m.PartnerShowPage })));
const PartnerCreatePage = lazy(() => import("./admin/pages/partner-create").then((m) => ({ default: m.PartnerCreatePage })));
const PartnerEditPage = lazy(() => import("./admin/pages/partner-edit").then((m) => ({ default: m.PartnerEditPage })));

function AdminPageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

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
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return (
      <AdminApp>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <Authenticated key="admin-auth">
                <AdminLayout />
              </Authenticated>
            }
          >
            <Route index element={<Suspense fallback={<AdminPageLoader />}><DashboardPage /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<AdminPageLoader />}><OrderListPage /></Suspense>} />
            <Route path="orders/:id" element={<Suspense fallback={<AdminPageLoader />}><OrderShowPage /></Suspense>} />
            <Route path="coupons" element={<Suspense fallback={<AdminPageLoader />}><CouponListPage /></Suspense>} />
            <Route path="coupons/new" element={<Suspense fallback={<AdminPageLoader />}><CouponCreatePage /></Suspense>} />
            <Route path="coupons/:id" element={<Suspense fallback={<AdminPageLoader />}><CouponShowPage /></Suspense>} />
            <Route path="coupons/:id/edit" element={<Suspense fallback={<AdminPageLoader />}><CouponEditPage /></Suspense>} />
            <Route path="partners" element={<Suspense fallback={<AdminPageLoader />}><PartnerListPage /></Suspense>} />
            <Route path="partners/new" element={<Suspense fallback={<AdminPageLoader />}><PartnerCreatePage /></Suspense>} />
            <Route path="partners/:id" element={<Suspense fallback={<AdminPageLoader />}><PartnerShowPage /></Suspense>} />
            <Route path="partners/:id/edit" element={<Suspense fallback={<AdminPageLoader />}><PartnerEditPage /></Suspense>} />
            <Route path="customers" element={<Suspense fallback={<AdminPageLoader />}><CustomerListPage /></Suspense>} />
            <Route path="customers/:email" element={<Suspense fallback={<AdminPageLoader />}><CustomerShowPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<AdminPageLoader />}><AdminUsersPage isAdminFilter={false} /></Suspense>} />
            <Route path="users/:id" element={<Suspense fallback={<AdminPageLoader />}><AdminUserShowPage /></Suspense>} />
            <Route path="admins" element={<Suspense fallback={<AdminPageLoader />}><AdminUsersPage isAdminFilter={true} /></Suspense>} />
            <Route path="admins/:id" element={<Suspense fallback={<AdminPageLoader />}><AdminUserShowPage /></Suspense>} />
          </Route>
        </Routes>
      </AdminApp>
    );
  }

  return <StorefrontApp />;
}

function StorefrontApp() {
  useReferralTracking();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    const ref = params.get("ref");
    if (ref?.trim()) {
      setReferralCookie(ref);
      params.delete("ref");
      changed = true;
    }

    const code = params.get("code");
    if (code?.trim()) {
      try {
        sessionStorage.setItem("pending_coupon_code", code.trim());
      } catch {
        // sessionStorage may be unavailable
      }
      params.delete("code");
      changed = true;
    }

    if (changed) {
      const qs = params.toString();
      const newPath = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState(null, "", newPath);
    }
  }, []);

  const [isLegalSheetOpen, setIsLegalSheetOpen] = useState(false);
  const [activeLegalSection, setActiveLegalSection] =
    useState<LegalMenuSection>("legal");
  const [contentOverlaySlug, setContentOverlaySlug] = useState<string | null>(
    null,
  );
  const [isFooterCheckoutAvailable, setIsFooterCheckoutAvailable] =
    useState(false);
  const [isFooterResetAvailable, setIsFooterResetAvailable] = useState(false);
  const [onFooterReset, setOnFooterReset] = useState<(() => void) | null>(null);
  const [successfulSlotsForCheckout, setSuccessfulSlotsForCheckout] = useState<
    UploadedSlotResult[]
  >([]);
  const [orderableSlots, setOrderableSlots] = useState<OrderableSlotSummary[]>(
    [],
  );
  const [orderSlotSelection, setOrderSlotSelection] = useState<
    Partial<Record<UploadSlotKey, boolean>>
  >({});
  const [onCheckoutWithUpload, setOnCheckoutWithUpload] = useState<
    (() => Promise<UploadedSlotResult[]>) | null
  >(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [uploadPageKey, setUploadPageKey] = useState(0);

  useEffect(() => {
    if (location.pathname === "/upload") {
      setUploadPageKey((k) => k + 1);
    }
  }, [location.pathname, location.key]);

  const uploadInitialSlots: UploadedSlotResult[] =
    (location.state as { restoredSlots?: UploadedSlotResult[] } | null)
      ?.restoredSlots?.length
      ? (location.state as { restoredSlots: UploadedSlotResult[] })
          .restoredSlots
      : restoreUploadSlots();

  const openLegalSheet = (section: LegalMenuSection) => {
    setActiveLegalSection(section);
    setIsLegalSheetOpen(true);
  };

  const openContentPage = useCallback((slug: string) => {
    setContentOverlaySlug(slug);
  }, []);

  const closeContentPage = useCallback(() => {
    setContentOverlaySlug(null);
  }, []);

  const handleCheckoutWithUpload = useCallback(
    (action: (() => Promise<UploadedSlotResult[]>) | null) => {
      setOnCheckoutWithUpload(() => action);
    },
    [],
  );

  // Persist upload slots to sessionStorage so they survive navigation away from /upload
  const handleSuccessfulSlotsChange = useCallback(
    (slots: UploadedSlotResult[]) => {
      setSuccessfulSlotsForCheckout(slots);
      persistUploadSlots(slots);
    },
    [],
  );

  // Clear persisted upload slots on reset
  const handleResetActionChange = useCallback(
    (action: (() => void) | null) => {
      if (action) {
        setOnFooterReset(() => () => {
          action();
          clearUploadSlots();
        });
      } else {
        setOnFooterReset(null);
      }
    },
    [],
  );

  const showFooterCheckout =
    location.pathname === "/upload" && isFooterCheckoutAvailable;
  const showFooterReset =
    location.pathname === "/upload" && isFooterResetAvailable;

  const footerOrderRows = useMemo(
    () =>
      orderableSlots
        .slice()
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((slot) => {
          const isUploaded = successfulSlotsForCheckout.some(
            (uploadedSlot) => uploadedSlot.slotKey === slot.slotKey,
          );

          return {
            slotKey: slot.slotKey,
            slotIndex: slot.slotIndex,
            proportion: slot.aspectRatio ?? slot.displayImageProportion,
            isUploaded,
            unitPrice: CANVAS_PRINT_UNIT_PRICE,
          };
        }),
    [orderableSlots, successfulSlotsForCheckout],
  );

  const checkedOrderSlotKeys = useMemo(
    () =>
      new Set(
        footerOrderRows
          .filter((row) => orderSlotSelection[row.slotKey] ?? true)
          .map((row) => row.slotKey),
      ),
    [footerOrderRows, orderSlotSelection],
  );

  const hasCheckedOrderSlots = useMemo(
    () => footerOrderRows.some((row) => checkedOrderSlotKeys.has(row.slotKey)),
    [checkedOrderSlotKeys, footerOrderRows],
  );

  useEffect(() => {
    const activeSlotKeys = orderableSlots.map((slot) => slot.slotKey);

    setOrderSlotSelection((previousSelection) => {
      const nextSelection: Partial<Record<UploadSlotKey, boolean>> = {};

      activeSlotKeys.forEach((slotKey) => {
        nextSelection[slotKey] = previousSelection[slotKey] ?? true;
      });

      return nextSelection;
    });
  }, [orderableSlots]);

  const toggleFooterOrderSlot = useCallback((slotKey: UploadSlotKey) => {
    setOrderSlotSelection((previousSelection) => {
      const currentValue = previousSelection[slotKey] ?? true;

      return {
        ...previousSelection,
        [slotKey]: !currentValue,
      };
    });
  }, []);

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
                key={uploadPageKey}
                onCheckoutAvailabilityChange={setIsFooterCheckoutAvailable}
                onResetAvailabilityChange={setIsFooterResetAvailable}
                onResetActionChange={handleResetActionChange}
                onSuccessfulSlotsChange={handleSuccessfulSlotsChange}
                onOrderableSlotsChange={setOrderableSlots}
                onCheckoutWithUpload={handleCheckoutWithUpload}
                imageDebugDataEnabled={showUploaderDebugData}
                initialRestoredSlots={uploadInitialSlots}
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
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/complaint" element={<ComplaintPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
          <Route
            path="/account/*"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer
        onOpenContentPage={openContentPage}
        showCheckout={showFooterCheckout}
        checkoutDisabled={showFooterCheckout && !hasCheckedOrderSlots}
        onCheckout={async () => {
          if (!hasCheckedOrderSlots) {
            return;
          }

          let slotsToCheckout = successfulSlotsForCheckout;

          if (onCheckoutWithUpload) {
            slotsToCheckout = await onCheckoutWithUpload();
          }

          navigate("/checkout", {
            state: {
              uploadedSlots: slotsToCheckout.filter((slot) =>
                checkedOrderSlotKeys.has(slot.slotKey),
              ),
            },
          });
        }}
        orderRows={footerOrderRows}
        checkedOrderSlotKeys={checkedOrderSlotKeys}
        onToggleOrderSlot={toggleFooterOrderSlot}
        showReset={showFooterReset}
        onReset={onFooterReset ?? undefined}
      />
      <LegalNavigationSheet
        open={isLegalSheetOpen}
        onOpenChange={setIsLegalSheetOpen}
        activeSection={activeLegalSection}
        onOpenContentPage={openContentPage}
      />
      {contentOverlaySlug && (
        <ContentPageOverlay
          page={getPageBySlug(contentOverlaySlug)}
          onClose={closeContentPage}
        />
      )}
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
