import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { t } from "@/locales/i18n";

export function CheckoutPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.name.trim()) {
      setError(t("checkout.errorName"));
      return;
    }
    if (!formData.address.trim()) {
      setError(t("checkout.errorAddress"));
      return;
    }

    setIsSubmitting(true);

    // Simulate checkout process
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch {
      setError(t("checkout.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.address.trim();

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <ShoppingBag className="h-10 w-10 text-blue-600" />
            {t("checkout.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("checkout.subtitle")}</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("checkout.shippingInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("checkout.orderSuccessful")}
                </h2>
                <p className="text-gray-600">
                  {t("checkout.orderSuccessMessage")}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  {t("checkout.redirecting")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    {t("checkout.personalInformation")}
                  </h3>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("checkout.fullName")}</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t("checkout.fullNamePlaceholder")}
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {t("checkout.addressInformation")}
                  </h3>

                  {/* Address Field */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t("checkout.streetAddress")}
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder={t("checkout.streetAddressPlaceholder")}
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* City Field */}
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("checkout.city")}</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder={t("checkout.cityPlaceholder")}
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  {/* Postal Code Field */}
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">
                      {t("checkout.postalCode")}
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      placeholder={t("checkout.postalCodePlaceholder")}
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>

                  {/* Country Field */}
                  <div className="space-y-2">
                    <Label htmlFor="country">{t("checkout.country")}</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      placeholder={t("checkout.countryPlaceholder")}
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    {t("checkout.orderSummary")}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {t("checkout.enhancedPhoto")}
                      </span>
                      <span className="font-semibold text-gray-900">1x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {t("checkout.canvasPrint")}
                      </span>
                      <span className="font-semibold text-gray-900">1x</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-gray-900">
                        {t("checkout.total")}
                      </span>
                      <span className="text-blue-600">€29.99</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full py-6 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      {t("checkout.placeOrder")}
                    </>
                  )}
                </Button>

                {/* Help Text */}
                <p className="text-xs text-gray-500 text-center">
                  {t("checkout.requiredFields")}
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
