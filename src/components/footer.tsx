import {
  FileText,
  Info,
  CheckCircle,
  Mail,
  Cookie,
  Shield,
  RotateCcw,
  Lock,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function Footer() {
  return (
    <footer className="w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-600">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/about"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.aboutUs")}
            </Link>
            <Link
              to="/legal"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.legalAndPrivacy")}
            </Link>
            <Link
              to="/consents"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.consents")}
            </Link>
            <Link
              to="/contact"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.contact")}
            </Link>
            <Link
              to="/cookies"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Cookie className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.cookies")}
            </Link>
            <Link
              to="/privacy"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.privacy")}
            </Link>
            <Link
              to="/returns"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.returns")}
            </Link>
            <Link
              to="/security"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.security")}
            </Link>
            <Link
              to="/shipping"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.shipping")}
            </Link>
            <Link
              to="/terms"
              className="flex items-center whitespace-nowrap text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t("common.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
