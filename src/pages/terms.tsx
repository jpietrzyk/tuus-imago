import {
  FileText,
  ShoppingCart,
  DollarSign,
  Truck,
  Package,
  UserX,
  Copyright,
  Shield,
  AlertTriangle,
  XCircle,
  Scale,
  FileWarning,
  Scale3d,
  Mail,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function TermsPage() {
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
            {t("terms.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("terms.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Main Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.main.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.main.description")}
              </p>
            </section>

            <Separator />

            {/* Scope of Services */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.scope.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.scope.description")}
              </p>
            </section>

            <Separator />

            {/* Ordering Process */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.ordering.title")}
                </h2>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>{t("terms.ordering.step1")}</li>
                <li>{t("terms.ordering.step2")}</li>
                <li>{t("terms.ordering.step3")}</li>
                <li>{t("terms.ordering.step4")}</li>
                <li>{t("terms.ordering.step5")}</li>
                <li>{t("terms.ordering.step6")}</li>
              </ol>
            </section>

            <Separator />

            {/* Pricing and Payment */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.pricing.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.pricing.description")}
              </p>
              <p className="text-gray-700 leading-relaxed italic">
                {t("terms.pricing.fees")}
              </p>
            </section>

            <Separator />

            {/* Delivery Terms */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.delivery.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.delivery.description")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.delivery.tracking")}
              </p>
            </section>

            <Separator />

            {/* Products and Quality */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.products.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.products.description")}
              </p>
            </section>

            <Separator />

            {/* Customer Obligations */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.obligations.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.obligations.description")}
              </p>
            </section>

            <Separator />

            {/* Intellectual Property */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Copyright className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.intellectualProperty.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.intellectualProperty.description")}
              </p>
            </section>

            <Separator />

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.liability.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.liability.description")}
              </p>
            </section>

            <Separator />

            {/* Force Majeure */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.forceMajeure.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.forceMajeure.description")}
              </p>
            </section>

            <Separator />

            {/* Contract Termination */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.termination.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.termination.description")}
              </p>
            </section>

            <Separator />

            {/* Dispute Resolution */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.disputeResolution.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.disputeResolution.description")}
              </p>
            </section>

            <Separator />

            {/* Complaint Handling */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.complaints.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.complaints.description")}
              </p>
            </section>

            <Separator />

            {/* Changes to Terms */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.changes.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.changes.description")}
              </p>
            </section>

            <Separator />

            {/* Applicable Law */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale3d className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.applicableLaw.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.applicableLaw.description")}
              </p>
            </section>

            <Separator />

            {/* Consumer Rights */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.consumerRights.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.consumerRights.description")}
              </p>
            </section>

            <Separator />

            {/* Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("terms.contact.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("terms.contact.description")}
              </p>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("terms.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
