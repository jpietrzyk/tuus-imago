import { CreditCard, Lock, Clock, RefreshCw, Shield, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function PaymentsPage() {
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
            {t("payments.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("payments.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Payment Methods Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.methods.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("payments.methods.blik.label")}
                  </h3>
                  <p className="text-sm mb-2">
                    {t("payments.methods.blik.description")}
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>{t("payments.methods.blik.step1")}</li>
                    <li>{t("payments.methods.blik.step2")}</li>
                    <li>{t("payments.methods.blik.step3")}</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("payments.methods.transfer.label")}
                  </h3>
                  <p className="text-sm mb-2">
                    {t("payments.methods.transfer.description")}
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>{t("payments.methods.transfer.step1")}</li>
                    <li>{t("payments.methods.transfer.step2")}</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("payments.methods.cards.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.methods.cards.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("payments.methods.installments.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.methods.installments.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment Processing Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.processing.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.processing.timeframe.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.processing.timeframe.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.processing.confirmation.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.processing.confirmation.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment Security Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.security.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.security.ssl.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.security.ssl.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.security.pci.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.security.pci.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.security.dataProtection.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.security.dataProtection.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Refunds Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.refunds.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.refunds.process.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.refunds.process.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.refunds.timeframe.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.refunds.timeframe.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.refunds.method.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.refunds.method.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment Failure Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.failure.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.failure.reasons.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.failure.reasons.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("payments.failure.action.label")}
                  </h3>
                  <p className="text-sm">
                    {t("payments.failure.action.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Przelewy24 Links Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("payments.p24.title")}
                </h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">{t("payments.p24.description")}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <a
                      href="https://www.przelewy24.pl/regulamin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t("payments.p24.terms")}
                    </a>
                  </p>
                  <p>
                    <a
                      href="https://www.przelewy24.pl/polityka-prywatnosci"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t("payments.p24.privacy")}
                    </a>
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("payments.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
