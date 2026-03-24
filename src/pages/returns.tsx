import {
  RotateCcw,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  RefreshCw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function ReturnsPage() {
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
            {t("returns.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("returns.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Main Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("returns.main.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.main.description")}
              </p>
            </section>

            <Separator />

            {/* Right of Withdrawal Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.rightOfWithdrawal.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.rightOfWithdrawal.period")}
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mt-2">
                <p className="font-medium text-gray-900 mb-2">
                  {t("returns.rightOfWithdrawal.howTo")}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>{t("returns.rightOfWithdrawal.step1")}</li>
                  <li>{t("returns.rightOfWithdrawal.step2")}</li>
                  <li>{t("returns.rightOfWithdrawal.step3")}</li>
                </ol>
                <p className="text-sm text-gray-600 mt-2">
                  {t("returns.rightOfWithdrawal.deadline")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Return Costs Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.returnCosts.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.returnCosts.whoPays")}
              </p>
              <p className="text-gray-600 text-sm">
                {t("returns.returnCosts.condition")}
              </p>
            </section>

            <Separator />

            {/* Refund Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.refund.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.refund.timeline")}
              </p>
              <p className="text-gray-600 text-sm">
                {t("returns.refund.method")}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-gray-700 text-sm">
                  <strong>{t("returns.refund.title")}:</strong>{" "}
                  {t("returns.refund.delay")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Condition of Goods Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.condition.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.condition.description")}
              </p>
            </section>

            <Separator />

            {/* Damaged/Defective Goods Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.damaged.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.damaged.description")}
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mt-2">
                <p className="font-medium text-gray-900 mb-2">
                  {t("returns.damaged.process")}
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>{t("returns.damaged.step1")}</li>
                  <li>{t("returns.damaged.step2")}</li>
                  <li>{t("returns.damaged.step3")}</li>
                  <li>{t("returns.damaged.step4")}</li>
                </ol>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                <p className="text-gray-700 text-sm">
                  {t("returns.damaged.freeReturn")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Complaint Form Link Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.complaintForm.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.complaintForm.description")}{" "}
                <Link
                  to="/complaint"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {t("returns.complaintForm.link")}
                </Link>
              </p>
            </section>

            <Separator />

            {/* Contact Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.contact.title")}
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("returns.contact.address")}
                    </p>
                    <p className="text-gray-700">
                      {t("returns.contact.street")}
                    </p>
                    <p className="text-gray-700">{t("returns.contact.city")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("returns.contact.phone")}
                    </p>
                    <p className="text-gray-700">
                      {t("returns.contact.phoneNumber")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("returns.contact.email")}
                    </p>
                    <a
                      href="mailto:returns@tuusimago.com"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {t("returns.contact.emailAddress")}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("returns.contact.hours")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Non-Returnable Items Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.nonReturnable.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.nonReturnable.description")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>{t("returns.nonReturnable.item1")}</li>
                <li>{t("returns.nonReturnable.item2")}</li>
                <li>{t("returns.nonReturnable.item3")}</li>
              </ul>
            </section>

            <Separator />

            {/* Legal Basis Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("returns.legalBasis.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("returns.legalBasis.description")}
              </p>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("returns.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
