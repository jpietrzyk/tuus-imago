import { Heart, Users, Award, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function AboutPage() {
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
            {t("about.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("about.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Our Mission Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("about.mission.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("about.mission.description")}
              </p>
            </section>

            <Separator />

            {/* Our Story Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("about.story.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("about.story.description")}
              </p>
            </section>

            <Separator />

            {/* What We Do Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("about.whatWeDo.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.whatWeDo.aiEnhancement.label")}
                  </h3>
                  <p>{t("about.whatWeDo.aiEnhancement.description")}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.whatWeDo.canvasPrinting.label")}
                  </h3>
                  <p>{t("about.whatWeDo.canvasPrinting.description")}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.whatWeDo.customFraming.label")}
                  </h3>
                  <p>{t("about.whatWeDo.customFraming.description")}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Our Values Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("about.values.title")}
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.values.qualityFirst.label")}
                  </h3>
                  <p className="text-sm">
                    {t("about.values.qualityFirst.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.values.customerSatisfaction.label")}
                  </h3>
                  <p className="text-sm">
                    {t("about.values.customerSatisfaction.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.values.innovation.label")}
                  </h3>
                  <p className="text-sm">
                    {t("about.values.innovation.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("about.values.sustainability.label")}
                  </h3>
                  <p className="text-sm">
                    {t("about.values.sustainability.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contact Information */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("about.contact.title")}
                </h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">{t("about.contact.description")}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("about.contact.email")}
                    </span>{" "}
                    <a
                      href="mailto:info@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      info@tuusimago.com
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("about.contact.phone")}
                    </span>{" "}
                    +48 123 456 789
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("about.contact.address")}
                    </span>{" "}
                    123 Innovation Street, Warsaw, Poland
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("about.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
