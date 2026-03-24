import {
  Shield,
  User,
  Database,
  Clock,
  Globe,
  Cookie,
  Lock,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { t } from "@/locales/i18n";

export function PrivacyPage() {
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
            {t("privacy.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("privacy.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Main Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("privacy.main.title")}
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.main.description")}
              </p>
            </section>

            <Separator />

            {/* Data Controller Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.dataController.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.dataController.description")}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <strong>{t("privacy.dataController.name")}:</strong>{" "}
                  {t("privacy.dataController.nameValue")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("privacy.dataController.address")}:</strong>{" "}
                  {t("privacy.dataController.addressValue")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("privacy.dataController.email")}:</strong>{" "}
                  <a
                    href="mailto:info@tuusimago.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    info@tuusimago.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>{t("privacy.dataController.phone")}:</strong>{" "}
                  {t("privacy.dataController.phoneValue")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Types of Data Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.typesOfData.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.typesOfData.description")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                <li>{t("privacy.typesOfData.item1")}</li>
                <li>{t("privacy.typesOfData.item2")}</li>
                <li>{t("privacy.typesOfData.item3")}</li>
                <li>{t("privacy.typesOfData.item4")}</li>
                <li>{t("privacy.typesOfData.item5")}</li>
                <li>{t("privacy.typesOfData.item6")}</li>
              </ul>
            </section>

            <Separator />

            {/* Legal Basis Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.legalBasis.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.legalBasis.description")}
              </p>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-gray-700">
                  <strong>{t("privacy.legalBasis.article1")}</strong>{" "}
                  {t("privacy.legalBasis.article1Text")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("privacy.legalBasis.article2")}</strong>{" "}
                  {t("privacy.legalBasis.article2Text")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("privacy.legalBasis.article3")}</strong>{" "}
                  {t("privacy.legalBasis.article3Text")}
                </p>
              </div>
            </section>

            <Separator />

            {/* Data Purposes Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.dataPurposes.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.dataPurposes.description")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                <li>{t("privacy.dataPurposes.item1")}</li>
                <li>{t("privacy.dataPurposes.item2")}</li>
                <li>{t("privacy.dataPurposes.item3")}</li>
                <li>{t("privacy.dataPurposes.item4")}</li>
                <li>{t("privacy.dataPurposes.item5")}</li>
              </ul>
            </section>

            <Separator />

            {/* Data Sharing Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.dataSharing.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.dataSharing.description")}
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">
                  {t("privacy.dataSharing.partners")}
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>{t("privacy.dataSharing.partner1")}</li>
                  <li>{t("privacy.dataSharing.partner2")}</li>
                  <li>{t("privacy.dataSharing.partner3")}</li>
                  <li>{t("privacy.dataSharing.partner4")}</li>
                </ul>
              </div>
              <p className="text-gray-600 text-sm">
                {t("privacy.dataSharing.noSale")}
              </p>
            </section>

            <Separator />

            {/* Data Storage Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.dataStorage.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.dataStorage.description")}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">
                    {t("privacy.dataStorage.orderData")}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {t("privacy.dataStorage.orderDataPeriod")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">
                    {t("privacy.dataStorage.financialData")}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {t("privacy.dataStorage.financialDataPeriod")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">
                    {t("privacy.dataStorage.marketingData")}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {t("privacy.dataStorage.marketingDataPeriod")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">
                    {t("privacy.dataStorage.analyticsData")}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {t("privacy.dataStorage.analyticsDataPeriod")}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* User Rights Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.userRights.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.userRights.description")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right1Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right1Desc")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right2Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right2Desc")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right3Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right3Desc")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right4Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right4Desc")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right5Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right5Desc")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.userRights.right6Title")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.userRights.right6Desc")}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {t("privacy.userRights.exercise")}
              </p>
            </section>

            <Separator />

            {/* Cookies Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.cookies.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.cookies.description")}
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.cookies.necessaryTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.cookies.necessaryDesc")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.cookies.analyticsTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.cookies.analyticsDesc")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {t("privacy.cookies.marketingTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("privacy.cookies.marketingDesc")}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {t("privacy.cookies.manage")}
              </p>
            </section>

            <Separator />

            {/* Data Security Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.dataSecurity.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.dataSecurity.description")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                <li>{t("privacy.dataSecurity.item1")}</li>
                <li>{t("privacy.dataSecurity.item2")}</li>
                <li>{t("privacy.dataSecurity.item3")}</li>
                <li>{t("privacy.dataSecurity.item4")}</li>
                <li>{t("privacy.dataSecurity.item5")}</li>
              </ul>
            </section>

            <Separator />

            {/* Children Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.children.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.children.description")}
              </p>
            </section>

            <Separator />

            {/* Changes Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.changes.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.changes.description")}
              </p>
            </section>

            <Separator />

            {/* Contact Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.contact.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.contact.description")}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("privacy.contact.email")}
                    </p>
                    <a
                      href="mailto:info@tuusimago.com"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      info@tuusimago.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("privacy.contact.phone")}
                    </p>
                    <p className="text-gray-700">
                      {t("privacy.contact.phoneValue")}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {t("privacy.contact.responseTime")}
              </p>
              <p className="text-gray-600 text-sm">
                {t("privacy.contact.dpo")}{" "}
                <Link
                  to="/contact"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {t("privacy.contact.contactPage")}
                </Link>
              </p>
            </section>

            <Separator />

            {/* Complaints Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">
                  {t("privacy.complaints.title")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("privacy.complaints.description")}
              </p>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("privacy.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
