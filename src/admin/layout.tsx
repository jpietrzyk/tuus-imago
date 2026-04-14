import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Link2,
  Users,
  Shield,
  Building2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/locales/i18n";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: t("admin.navigation.dashboard"),
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: "/admin",
  },
  {
    label: t("admin.navigation.orders"),
    icon: <ShoppingCart className="h-5 w-5" />,
    path: "/admin/orders",
  },
  {
    label: t("admin.navigation.coupons"),
    icon: <Tag className="h-5 w-5" />,
    path: "/admin/coupons",
  },
  {
    label: t("admin.navigation.referralCodes"),
    icon: <Link2 className="h-5 w-5" />,
    path: "/admin/refs",
  },
  {
    label: t("admin.navigation.partners"),
    icon: <Building2 className="h-5 w-5" />,
    path: "/admin/partners",
  },
  {
    label: t("admin.navigation.customers"),
    icon: <Users className="h-5 w-5" />,
    path: "/admin/customers",
  },
  {
    label: t("admin.navigation.users"),
    icon: <Users className="h-5 w-5" />,
    path: "/admin/users",
  },
  {
    label: t("admin.navigation.admins"),
    icon: <Shield className="h-5 w-5" />,
    path: "/admin/admins",
  },
];

type AdminIdentity = {
  id: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate("/admin/login");
      },
    });
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">Tuus Imago</h1>
        <p className="text-xs text-muted-foreground">
          {t("admin.navigation.adminPanel")}
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="mb-2 text-xs text-muted-foreground truncate">
          {identity?.name ?? identity?.email ?? "Admin"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("admin.navigation.signOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col border-r bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-56 bg-card z-50 shadow-lg">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
