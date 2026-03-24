import {
  Cookie,
  Info,
  BarChart2,
  Settings,
  AlertCircle,
  RefreshCw,
  Mail,
  Shield,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          {t("common.backToHome")}
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t("cookies.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("cookies.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Main Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.main.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.main.description")}
              </p>
            </section>

            <Separator />

            {/* What Are Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.whatAreCookies.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.whatAreCookies.description")}
              </p>
            </section>

            <Separator />

            {/* Types of Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.types.title")}
                </h2>
              </div>

              {/* Necessary Cookies */}
              <div className="ml-7 space-y-2">
                <h3 className="font-medium text-gray-900">
                  {t("cookies.types.necessary.title")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t("cookies.types.necessary.description")}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {t("cookies.types.necessary.examples")}
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="ml-7 space-y-2 mt-4">
                <h3 className="font-medium text-gray-900">
                  {t("cookies.types.analytics.title")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t("cookies.types.analytics.description")}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {t("cookies.types.analytics.examples")}
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="ml-7 space-y-2 mt-4">
                <h3 className="font-medium text-gray-900">
                  {t("cookies.types.functional.title")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t("cookies.types.functional.description")}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {t("cookies.types.functional.examples")}
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="ml-7 space-y-2 mt-4">
                <h3 className="font-medium text-gray-900">
                  {t("cookies.types.marketing.title")}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t("cookies.types.marketing.description")}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {t("cookies.types.marketing.examples")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Third-Party Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.thirdParty.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.thirdParty.description")}
              </p>
              <ul className="list-disc list-inside ml-7 space-y-1 text-gray-700">
                <li>{t("cookies.thirdParty.googleAnalytics")}</li>
                <li>{t("cookies.thirdParty.przelewy24")}</li>
                <li>{t("cookies.thirdParty.cloudinary")}</li>
                <li>{t("cookies.thirdParty.socialMedia")}</li>
              </ul>
            </section>

            <Separator />

            {/* Cookie Duration */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.duration.title")}
                </h2>
              </div>
              <ul className="list-disc list-inside ml-7 space-y-2 text-gray-700">
                <li>{t("cookies.duration.session")}</li>
                <li>{t("cookies.duration.persistent")}</li>
              </ul>
            </section>

            <Separator />

            {/* Cookie Consent */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.consent.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.consent.description")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.consent.withdraw")}
              </p>
            </section>

            <Separator />

            {/* Managing Cookies */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.manage.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.manage.description")}
              </p>
              <ul className="list-disc list-inside ml-7 space-y-1 text-gray-700">
                <li>{t("cookies.manage.block")}</li>
                <li>{t("cookies.manage.blockThirdParty")}</li>
                <li>{t("cookies.manage.delete")}</li>
                <li>{t("cookies.manage.notify")}</li>
              </ul>
              <p className="text-gray-700 leading-relaxed italic">
                {t("cookies.manage.note")}
              </p>
            </section>

            <Separator />

            {/* Consequences */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.consequences.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.consequences.description")}
              </p>
            </section>

            <Separator />

            {/* Policy Updates */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.updates.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.updates.description")}
              </p>
            </section>

            <Separator />

            {/* Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("cookies.contact.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("cookies.contact.description")}
              </p>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("cookies.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
