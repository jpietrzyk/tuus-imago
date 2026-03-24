import { Truck, Package, Clock, AlertCircle, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function ShippingPage() {
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
            {t("shipping.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("shipping.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Main Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("shipping.main.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("shipping.main.description")}
              </p>
            </section>

            <Separator />

            {/* Carriers Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("shipping.carriers.title")}
                </h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("shipping.carriers.inpost")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Costs Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("shipping.costs.title")}
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                  <span className="text-gray-700">
                    {t("shipping.costs.standardLabel")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {t("shipping.costs.standard")}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {t("shipping.timeframe.note")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Timeframe Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("shipping.timeframe.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("shipping.timeframe.businessDays")}
              </p>
            </section>

            <Separator />

            {/* Tracking Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("shipping.tracking.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("shipping.tracking.description")}
              </p>
            </section>

            <Separator />

            {/* Failed Delivery Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("shipping.failedDelivery.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("shipping.failedDelivery.description")}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
                <p className="text-gray-700 leading-relaxed">
                  <strong>{t("shipping.failedDelivery.title")}:</strong>{" "}
                  {t("shipping.failedDelivery.procedure")}
                </p>
              </div>
            </section>

            <Separator />

            {/* No International Shipping */}
            <section className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">
                  {t("shipping.noInternational")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("shipping.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
