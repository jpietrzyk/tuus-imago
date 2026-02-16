import { Routes, Route } from "react-router-dom";
import { Footer } from "@/components/footer";
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
import bgImage from "@/assets/bg_v1.jpg";

// Main App Component with Routes
export function App() {
  return (
    <div className="h-screen flex flex-col">
      <div
        className="flex-1 overflow-auto bg-cover bg-center relative"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="fixed top-6 left-6 z-10">
          <h1 className="text-3xl font-bold drop-shadow-lg">
            <span className="text-white">Tuus</span>
            <span className="text-blue-300">Imago</span>
          </h1>
        </div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
      </div>
      <Footer />
    </div>
  );
}

export default App;
