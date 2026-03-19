import { Scale, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";

interface FooterProps {
  onOpenLegalMenu: () => void;
  showCheckout?: boolean;
  onCheckout?: () => void;
}

export function Footer({
  onOpenLegalMenu,
  showCheckout = false,
  onCheckout,
}: FooterProps) {
  return (
    <footer className="w-full h-(--app-shell-bar-height) border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="text-sm text-gray-600 whitespace-nowrap shrink-0">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showCheckout && onCheckout ? (
              <Button
                size="sm"
                className="h-9 gap-2 rounded-full px-4 text-xs font-semibold tracking-[0.01em] shadow-sm sm:text-sm"
                onClick={onCheckout}
                aria-label={t("checkout.openCheckout")}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {t("checkout.openCheckout")}
              </Button>
            ) : null}

            <Button
              size="sm"
              variant="ghost"
              className="h-9 rounded-full px-3 text-xs sm:text-sm"
              onClick={onOpenLegalMenu}
              aria-label={t("common.legalMenu")}
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              {t("common.legalMenu")}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
