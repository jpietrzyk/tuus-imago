import { FileText, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function Footer() {
  return (
    <footer className="w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 max-h-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-600">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <Link
              to="/about"
              className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Info className="h-4 w-4 mr-2" />
              {t("common.aboutUs")}
            </Link>
            <Link
              to="/legal"
              className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t("common.legalAndPrivacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
