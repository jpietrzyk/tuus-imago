import { Mail, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function ContactPage() {
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
            {t("contact.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("contact.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("contact.contactInfo.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("contact.contactInfo.email.label")}
                  </h3>
                  <p className="text-sm">
                    <a
                      href="mailto:info@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      info@tuusimago.com
                    </a>
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("contact.contactInfo.phone.label")}
                  </h3>
                  <p className="text-sm">+48 123 456 789</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("contact.contactInfo.address.label")}
                  </h3>
                  <p className="text-sm">
                    123 Innovation Street, Warsaw, Poland
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Business Hours */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("contact.businessHours.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("contact.businessHours.description")}
              </p>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("contact.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
