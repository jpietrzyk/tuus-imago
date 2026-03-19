import { BadgeDollarSign, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import type { LegalMenuSection } from "@/components/legal-navigation-sheet";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";

interface HeaderProps {
  onOpenLegalMenu: (section: LegalMenuSection) => void;
}

export function Header({ onOpenLegalMenu }: HeaderProps) {
  return (
    <header className="w-full h-[var(--app-shell-bar-height)] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        <Link
          to="/"
          aria-label="Tuus Imago – home"
          className="inline-flex items-center"
        >
          <span className="text-3xl font-bold leading-none">
            <span className="text-slate-900">Tuus</span>
            <span className="text-blue-500">Imago</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm"
            onClick={() => onOpenLegalMenu("legal")}
            aria-label={t("common.legalMenu")}
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
            {t("common.legalMenu")}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm"
            onClick={() => onOpenLegalMenu("payments")}
            aria-label={t("common.paymentsP24")}
          >
            <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
            <span>P24</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
