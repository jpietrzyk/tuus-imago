import { FileText, Info, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function LegalPage() {
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
            {t("legal.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("legal.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Privacy Policy Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("legal.privacyPolicy.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("legal.privacyPolicy.description")}
              </p>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.privacyPolicy.dataCollection.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.privacyPolicy.dataCollection.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.privacyPolicy.dataStorage.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.privacyPolicy.dataStorage.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.privacyPolicy.dataUsage.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.privacyPolicy.dataUsage.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.privacyPolicy.dataRetention.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.privacyPolicy.dataRetention.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Terms of Service Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("legal.termsOfService.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("legal.termsOfService.description")}
              </p>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.termsOfService.serviceUse.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.termsOfService.serviceUse.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.termsOfService.contentOwnership.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.termsOfService.contentOwnership.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.termsOfService.refundPolicy.label")}
                  </h3>
                  <p className="text-sm">
                    {t("legal.termsOfService.refundPolicy.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("legal.termsOfService.limitationOfLiability.label")}
                  </h3>
                  <p className="text-sm">
                    {t(
                      "legal.termsOfService.limitationOfLiability.description",
                    )}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("legal.contact.title")}
                </h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">{t("legal.contact.description")}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("legal.contact.email")}
                    </span>{" "}
                    <a
                      href="mailto:support@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@tuusimago.com
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("legal.contact.phone")}
                    </span>{" "}
                    +48 123 456 789
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("legal.contact.address")}
                    </span>{" "}
                    123 Innovation Street, Warsaw, Poland
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("legal.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
