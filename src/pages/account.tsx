import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import { User, Package, MapPin, CreditCard } from "lucide-react";
import { t } from "@/locales/i18n";
import { ProfileTab } from "@/components/account/profile-tab";
import { OrdersTab } from "@/components/account/orders-tab";
import { AddressesTab } from "@/components/account/addresses-tab";
import { PaymentsTab } from "@/components/account/payments-tab";

type TabId = "profile" | "orders" | "addresses" | "payments";

const TABS: { id: TabId; label: string; icon: React.ReactNode; path: string }[] = [
  { id: "profile", label: t("account.profile"), icon: <User className="h-4 w-4" />, path: "/account" },
  { id: "orders", label: t("auth.orders"), icon: <Package className="h-4 w-4" />, path: "/account/orders" },
  { id: "addresses", label: t("auth.addresses"), icon: <MapPin className="h-4 w-4" />, path: "/account/addresses" },
  { id: "payments", label: t("account.paymentHistory"), icon: <CreditCard className="h-4 w-4" />, path: "/account/payments" },
];

function AccountLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = (() => {
    const exact = TABS.find((tab) => location.pathname === tab.path);
    if (exact) return exact.id;
    const prefix = TABS.find((tab) => tab.path !== "/account" && location.pathname.startsWith(tab.path + "/"));
    return prefix?.id ?? "profile";
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("account.title")}
        </h1>

        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "addresses" && <AddressesTab />}
        {activeTab === "payments" && <PaymentsTab />}
      </div>
    </div>
  );
}

export function AccountPage() {
  return (
    <Routes>
      <Route index element={<AccountLayout />} />
      <Route path="orders" element={<AccountLayout />} />
      <Route path="orders/:orderId" element={<AccountLayout />} />
      <Route path="addresses" element={<AccountLayout />} />
      <Route path="payments" element={<AccountLayout />} />
    </Routes>
  );
}
