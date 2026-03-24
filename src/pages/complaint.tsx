import { FileText, Mail, Clock, AlertCircle, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/locales/i18n";

export function ComplaintPage() {
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
            {t("complaint.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("complaint.subtitle")}</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {/* Complaint Information Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("complaint.info.title")}
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("complaint.info.deadline.label")}
                  </h3>
                  <p className="text-sm">
                    {t("complaint.info.deadline.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("complaint.info.responseTime.label")}
                  </h3>
                  <p className="text-sm">
                    {t("complaint.info.responseTime.description")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {t("complaint.info.requiredDocs.label")}
                  </h3>
                  <p className="text-sm">
                    {t("complaint.info.requiredDocs.description")}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Complaint Form Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("complaint.form.title")}
                </h2>
              </div>
              <form className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("complaint.form.customerInfo.title")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {t("complaint.form.name.label")} *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("complaint.form.name.placeholder")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t("complaint.form.email.label")} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("complaint.form.email.placeholder")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {t("complaint.form.phone.label")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t("complaint.form.phone.placeholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {t("complaint.form.address.label")}
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder={t("complaint.form.address.placeholder")}
                      />
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("complaint.form.orderInfo.title")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderNumber">
                        {t("complaint.form.orderNumber.label")} *
                      </Label>
                      <Input
                        id="orderNumber"
                        type="text"
                        placeholder={t(
                          "complaint.form.orderNumber.placeholder",
                        )}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orderDate">
                        {t("complaint.form.orderDate.label")}
                      </Label>
                      <Input id="orderDate" type="date" />
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("complaint.form.productInfo.title")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="product">
                      {t("complaint.form.product.label")}
                    </Label>
                    <Input
                      id="product"
                      type="text"
                      placeholder={t("complaint.form.product.placeholder")}
                    />
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("complaint.form.details.title")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="complaintType">
                      {t("complaint.form.type.label")} *
                    </Label>
                    <select
                      id="complaintType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">
                        {t("complaint.form.type.select")}
                      </option>
                      <option value="damaged">
                        {t("complaint.form.type.damaged")}
                      </option>
                      <option value="defective">
                        {t("complaint.form.type.defective")}
                      </option>
                      <option value="wrong">
                        {t("complaint.form.type.wrong")}
                      </option>
                      <option value="missing">
                        {t("complaint.form.type.missing")}
                      </option>
                      <option value="quality">
                        {t("complaint.form.type.quality")}
                      </option>
                      <option value="other">
                        {t("complaint.form.type.other")}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t("complaint.form.description.label")} *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t("complaint.form.description.placeholder")}
                      rows={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolution">
                      {t("complaint.form.resolution.label")}
                    </Label>
                    <Textarea
                      id="resolution"
                      placeholder={t("complaint.form.resolution.placeholder")}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    {t("complaint.form.photos.title")}
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">
                      {t("complaint.form.photos.description")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-gray-500" />
                      <label className="cursor-pointer">
                        <span className="text-sm text-blue-600 hover:text-blue-800">
                          {t("complaint.form.photos.upload")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" required className="mt-1" />
                    <span className="text-sm text-gray-700">
                      {t("complaint.form.consent.label")}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                  {t("complaint.form.submit")}
                </Button>
              </form>
            </section>

            <Separator />

            {/* Contact Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("complaint.contact.title")}
                </h2>
              </div>
              <div className="text-gray-700">
                <p className="mb-4">{t("complaint.contact.description")}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("complaint.contact.email.label")}:
                    </span>{" "}
                    <a
                      href="mailto:reklamacje@tuusimago.com"
                      className="text-blue-600 hover:underline"
                    >
                      reklamacje@tuusimago.com
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("complaint.contact.phone.label")}:
                    </span>{" "}
                    +48 123 456 789
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      {t("complaint.contact.address.label")}:
                    </span>{" "}
                    123 Innovation Street, Warsaw, Poland
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Business Hours */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">
                  {t("complaint.hours.title")}
                </h2>
              </div>
              <div className="text-gray-700">
                <p className="text-sm">{t("complaint.hours.description")}</p>
              </div>
            </section>

            <Separator />

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2">
              {t("complaint.lastUpdated")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
