import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { t } from "@/locales/i18n";
import { type UploadedSlotResult } from "@/components/image-uploader";
import { getCloudinaryThumbnailUrl } from "@/lib/image-transformations";
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "@/lib/pricing";
import { SHIPPING_COUNTRIES } from "@/lib/checkout-constants";

type UploadedCheckoutSlot = UploadedSlotResult & { transformedUrl: string };

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;
type FormTouched = Partial<Record<keyof FormData, boolean>>;

function validateField(
  name: keyof FormData,
  value: string,
): string | undefined {
  switch (name) {
    case "name":
      if (!value.trim()) return t("checkout.errorName");
      break;
    case "email":
      if (!value.trim() || !/.+@.+\..+/.test(value.trim()))
        return t("checkout.errorEmail");
      break;
    case "address":
      if (!value.trim()) return t("checkout.errorAddress");
      break;
    case "city":
      if (!value.trim()) return t("checkout.errorCity");
      break;
    case "postalCode":
      if (!value.trim()) return t("checkout.errorPostalCode");
      break;
    case "country":
      if (!value) return t("checkout.errorCountry");
      break;
  }
  return undefined;
}

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "name",
  "email",
  "address",
  "city",
  "postalCode",
  "country",
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadedSlots = (
    (location.state as { uploadedSlots?: UploadedSlotResult[] } | null)
      ?.uploadedSlots ?? []
  ).filter(
    (slot): slot is UploadedCheckoutSlot =>
      !slot.error && typeof slot.transformedUrl === "string",
  );
  const itemCount = uploadedSlots.length > 0 ? uploadedSlots.length : 1;
  const totalPrice = itemCount * CANVAS_PRINT_UNIT_PRICE;

  const slotLabel = (slotKey: UploadedSlotResult["slotKey"]): string => {
    if (slotKey === "left") return t("upload.slotLeft");
    if (slotKey === "right") return t("upload.slotRight");
    return t("upload.slotCenter");
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof FormData;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof FormData;
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, country: value }));
    if (touched.country) {
      setErrors((prev) => ({
        ...prev,
        country: validateField("country", value),
      }));
    }
  };

  const handleCountryBlur = () => {
    setTouched((prev) => ({ ...prev, country: true }));
    setErrors((prev) => ({
      ...prev,
      country: validateField("country", formData.country),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenericError(null);

    const allKeys = Object.keys(formData) as (keyof FormData)[];
    const newErrors: FormErrors = {};
    const newTouched: FormTouched = {};
    allKeys.forEach((key) => {
      newTouched[key] = true;
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOrderNumber(`ORD-${Date.now()}`);
    } catch {
      setGenericError(t("checkout.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = REQUIRED_FIELDS.every((f) => formData[f].trim());
  const fieldError = (field: keyof FormData) =>
    touched[field] && errors[field] ? errors[field] : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          {t("common.backToHome")}
        </Link>

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
            {orderNumber !== null ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("checkout.orderSuccessful")}
                </h2>
                <p className="text-gray-600 mb-2">
                  {t("checkout.orderSuccessMessage")}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {t("checkout.orderNumber")}:{" "}
                  <span className="font-mono font-semibold">{orderNumber}</span>
                </p>
                <Button onClick={() => navigate("/")}>
                  {t("checkout.continueShoppingButton")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {genericError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{genericError}</span>
                  </div>
                )}

                {/* Personal Information */}
                <fieldset className="space-y-4">
                  <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2 w-full">
                    <User className="h-5 w-5 text-blue-600" />
                    {t("checkout.personalInformation")}
                  </legend>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t("checkout.fullName")}</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder={t("checkout.fullNamePlaceholder")}
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={!!fieldError("name")}
                      aria-describedby={
                        fieldError("name") ? "name-error" : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("name") && (
                      <p
                        id="name-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("name")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("checkout.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("checkout.emailPlaceholder")}
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={!!fieldError("email")}
                      aria-describedby={
                        fieldError("email") ? "email-error" : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("email") && (
                      <p
                        id="email-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("email")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("checkout.phone")}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder={t("checkout.phonePlaceholder")}
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      aria-invalid={!!fieldError("phone")}
                      aria-describedby={
                        fieldError("phone") ? "phone-error" : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("phone") && (
                      <p
                        id="phone-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("phone")}
                      </p>
                    )}
                  </div>
                </fieldset>

                <Separator />

                {/* Address Information */}
                <fieldset className="space-y-4">
                  <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2 w-full">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    {t("checkout.addressInformation")}
                  </legend>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t("checkout.streetAddress")}
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      placeholder={t("checkout.streetAddressPlaceholder")}
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={!!fieldError("address")}
                      aria-describedby={
                        fieldError("address") ? "address-error" : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("address") && (
                      <p
                        id="address-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("address")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t("checkout.city")}</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder={t("checkout.cityPlaceholder")}
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={!!fieldError("city")}
                      aria-describedby={
                        fieldError("city") ? "city-error" : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("city") && (
                      <p
                        id="city-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("city")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">
                      {t("checkout.postalCode")}
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      autoComplete="postal-code"
                      placeholder={t("checkout.postalCodePlaceholder")}
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      required
                      aria-required="true"
                      aria-invalid={!!fieldError("postalCode")}
                      aria-describedby={
                        fieldError("postalCode")
                          ? "postalCode-error"
                          : undefined
                      }
                      className="w-full"
                    />
                    {fieldError("postalCode") && (
                      <p
                        id="postalCode-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("postalCode")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t("checkout.country")}</Label>
                    <Select
                      value={formData.country}
                      onValueChange={handleCountryChange}
                      disabled={isSubmitting}
                      required
                    >
                      <SelectTrigger
                        id="country"
                        autoComplete="country"
                        aria-required="true"
                        aria-invalid={!!fieldError("country")}
                        aria-describedby={
                          fieldError("country") ? "country-error" : undefined
                        }
                        onBlur={handleCountryBlur}
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={t("checkout.selectCountry")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIPPING_COUNTRIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldError("country") && (
                      <p
                        id="country-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600"
                      >
                        {fieldError("country")}
                      </p>
                    )}
                  </div>
                </fieldset>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    {t("checkout.orderSummary")}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {uploadedSlots.length > 0 ? (
                      <>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {t("checkout.uploadedImages")}
                        </p>
                        {uploadedSlots.map((slot) => (
                          <div
                            key={slot.slotKey}
                            className="flex items-center gap-3 py-1"
                          >
                            <img
                              src={getCloudinaryThumbnailUrl(
                                slot.transformedUrl,
                                48,
                                48,
                              )}
                              alt={slotLabel(slot.slotKey)}
                              className="h-12 w-12 rounded object-cover border border-gray-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">
                                {slotLabel(slot.slotKey)}
                              </p>
                            </div>
                            <a
                              href={slot.transformedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-blue-600 hover:text-blue-800"
                              aria-label={t("upload.openUploadedImage")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700">
                            {t("checkout.enhancedPhoto")}
                          </span>
                          <span className="font-semibold text-gray-900">
                            1x
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">
                            {t("checkout.canvasPrint")}
                          </span>
                          <span className="font-semibold text-gray-900">
                            1x
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-gray-900">
                        {t("checkout.total")}
                      </span>
                      <span className="text-blue-600">
                        {formatPrice(totalPrice)}
                      </span>
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
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      {t("checkout.placeOrder")}
                    </>
                  )}
                </Button>
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
