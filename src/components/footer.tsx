import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";

interface FooterProps {
  onOpenLegalMenu: () => void;
}

export function Footer({ onOpenLegalMenu }: FooterProps) {
  return (
    <footer className="w-full h-[var(--app-shell-bar-height)] bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="h-full flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 whitespace-nowrap shrink-0">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm"
            onClick={onOpenLegalMenu}
            aria-label={t("common.legalMenu")}
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
            {t("common.legalMenu")}
          </Button>
        </div>
      </div>
    </footer>
  );
}
