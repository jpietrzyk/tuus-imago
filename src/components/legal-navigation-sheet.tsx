import { useEffect, useRef } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  Building2,
  CheckCircle,
  ChevronRight,
  Cookie,
  FileText,
  Lock,
  Mail,
  RotateCcw,
  Shield,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { t } from "@/locales/i18n";
import { getPagesBySection } from "@/lib/content-loader";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Shield,
  Cookie,
  CheckCircle,
  Lock,
  RotateCcw,
  Truck,
  AlertCircle,
  BadgeDollarSign,
  Building2,
  Mail,
};

export type LegalMenuSection = "legal" | "payments";

interface LegalNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: LegalMenuSection;
}

export function LegalNavigationSheet({
  open,
  onOpenChange,
  activeSection,
}: LegalNavigationSheetProps) {
  const location = useLocation();
  const legalSectionRef = useRef<HTMLElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const targetRef =
      activeSection === "payments" ? paymentSectionRef : legalSectionRef;

    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);

    return () => window.clearTimeout(timer);
  }, [open, activeSection]);

  const legalLinks = getPagesBySection("legal");
  const paymentLinks = getPagesBySection("payments");
  const companyLinks = getPagesBySection("company");

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full max-h-[82dvh] rounded-t-2xl border-t">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <DrawerTitle className="text-lg font-semibold">
                {t("legalMenu.title")}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("legalMenu.close")}
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="text-sm text-gray-600">
            {t("legalMenu.subtitle")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 pt-4 space-y-6">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeSection === "legal" ? "secondary" : "outline"}
              onClick={() =>
                legalSectionRef.current?.scrollIntoView({ block: "start" })
              }
            >
              {t("common.legalMenu")}
            </Button>
            <Button
              size="sm"
              variant={activeSection === "payments" ? "secondary" : "outline"}
              onClick={() =>
                paymentSectionRef.current?.scrollIntoView({ block: "start" })
              }
            >
              {t("common.paymentsP24")}
            </Button>
          </div>

          <section ref={legalSectionRef} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("legalMenu.sections.legal")}
            </h3>
            <div className="grid gap-2">
              {legalLinks.map((page) => {
                const Icon = iconMap[page.icon] ?? FileText;
                return (
                  <Link
                    key={page.slug}
                    to={`/${page.slug}`}
                    state={{ from: location.pathname }}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4 text-blue-600"
                        aria-hidden="true"
                      />
                      {page.title}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <section ref={paymentSectionRef} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("legalMenu.sections.payments")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("legalMenu.paymentIntro")}
            </p>
            <div className="grid gap-2">
              {paymentLinks.map((page) => {
                const Icon = iconMap[page.icon] ?? BadgeDollarSign;
                return (
                  <Link
                    key={page.slug}
                    to={`/${page.slug}`}
                    state={{ from: location.pathname }}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4 text-blue-600"
                        aria-hidden="true"
                      />
                      {page.title}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
              <a
                href="https://www.przelewy24.pl/regulamin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <BadgeDollarSign
                    className="h-4 w-4 text-blue-600"
                    aria-hidden="true"
                  />
                  {t("legalMenu.p24Terms")}
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 text-gray-400"
                  aria-hidden="true"
                />
              </a>
              <a
                href="https://www.przelewy24.pl/polityka-prywatnosci"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <BadgeDollarSign
                    className="h-4 w-4 text-blue-600"
                    aria-hidden="true"
                  />
                  {t("legalMenu.p24Privacy")}
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 text-gray-400"
                  aria-hidden="true"
                />
              </a>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("legalMenu.sections.company")}
            </h3>
            <div className="grid gap-2">
              {companyLinks.map((page) => {
                const Icon = iconMap[page.icon] ?? Building2;
                return (
                  <Link
                    key={page.slug}
                    to={`/${page.slug}`}
                    state={{ from: location.pathname }}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        className="h-4 w-4 text-blue-600"
                        aria-hidden="true"
                      />
                      {page.title}
                    </span>
                    <ChevronRight
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
