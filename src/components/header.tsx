import { Menu, User, LogOut, Package, MapPin } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { LegalMenuSection } from "@/components/legal-navigation-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/locales/i18n";
import { useAuth } from "@/lib/auth-context";
import { CurrentPromotionBanner } from "@/components/current-promotion-banner";

interface HeaderProps {
  onOpenLegalMenu: (section: LegalMenuSection) => void;
  promotionSlogan?: string | null;
}

export function Header({ onOpenLegalMenu, promotionSlogan }: HeaderProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const userEmail = user?.email;
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <header className="w-full h-(--app-shell-bar-height) bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        <Link
          to="/"
          aria-label="Tuus Imago – home"
          className="inline-flex items-center"
        >
          <span className="text-3xl font-bold leading-none">
            <span className="text-slate-900">T</span>
            <span className="text-blue-500">I</span>
          </span>
        </Link>

        <CurrentPromotionBanner slogan={promotionSlogan} />

        <div className="flex items-center gap-1 sm:gap-2">
          {!loading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 p-0"
                    aria-label={t("auth.accountMenu")}
                  >
                    {userInitial}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                      {userEmail}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <User className="h-4 w-4 mr-2" />
                    {t("auth.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account/orders")}>
                    <Package className="h-4 w-4 mr-2" />
                    {t("auth.orders")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/account/addresses")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {t("auth.addresses")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("auth.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs sm:text-sm"
                onClick={() =>
                  navigate("/auth", {
                    state: { from: { pathname: location.pathname } },
                  })
                }
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("auth.signIn")}</span>
              </Button>
            ))}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onOpenLegalMenu("legal")}
            aria-label={t("common.legalMenu")}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
