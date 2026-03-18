import { Routes, Route } from "react-router-dom";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LandingPage } from "./pages/landing";
import { StartPage } from "./pages/start";
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
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 overflow-auto relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/upload" element={<UploadPage />} />
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
      <Footer />
    </div>
  );
}

export default App;
