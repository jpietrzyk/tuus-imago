import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  AlertTriangle,
  LogIn,
  Tag,
} from "lucide-react";
import { t, getCurrentLanguage } from "@/locales/i18n";
import { type UploadedSlotResult } from "@/components/image-uploader";
import { getCloudinaryThumbnailUrl } from "@/lib/image-transformations";
import { CANVAS_PRINT_UNIT_PRICE, formatPrice } from "@/lib/pricing";
import { SHIPPING_COUNTRIES } from "@/lib/checkout-constants";
import {
  createOrder,
  createP24Session,
  validateCoupon,
  getCustomerAddresses,
  getOrderStatus,
  type ValidateCouponResponse,
  type CustomerAddress,
} from "@/lib/orders-api";
import { useAuth, POST_AUTH_REDIRECT_KEY } from "@/lib/auth-context";
import {
  removeReferralCookie,
} from "@/lib/referral-cookie";

type UploadedCheckoutSlot = UploadedSlotResult & { transformedUrl: string };

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;
type FormTouched = Partial<Record<keyof FormData, boolean>>;

const ORDER_SUBMISSION_KEY_STORAGE = "checkout-order-submission-key";
const PENDING_ORDER_ID_STORAGE = "checkout-pending-order-id";
const CHECKOUT_SLOTS_STORAGE = "checkout-uploaded-slots";
const CHECKOUT_COUPON_CODE_STORAGE = "checkout-coupon-code";
const CHECKOUT_COUPON_RESULT_STORAGE = "checkout-coupon-result";

function generateOrderSubmissionKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Renders the order summary section showing ordered images and total price
 */
function OrderSummary({
  uploadedSlots,
  totalPrice,
  slotLabel,
}: {
  uploadedSlots: UploadedCheckoutSlot[];
  totalPrice: number;
  slotLabel: (slotKey: UploadedSlotResult["slotKey"]) => string;
}): React.ReactNode {
  return (
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
              <div key={slot.slotKey} className="flex items-center gap-3 py-1">
                <img
                  src={getCloudinaryThumbnailUrl(slot.transformedUrl, 48, 48)}
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
              <span className="font-semibold text-gray-900">1x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">{t("checkout.canvasPrint")}</span>
              <span className="font-semibold text-gray-900">1x</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span className="text-gray-900">{t("checkout.total")}</span>
          <span className="text-blue-600">{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

function validateField(
  name: keyof FormData,
  value: string | boolean,
): string | undefined {
  switch (name) {
    case "name":
      if (typeof value === "string" && !value.trim())
        return t("checkout.errorName");
      break;
    case "email":
      if (
        typeof value === "string" &&
        (!value.trim() || !/.+@.+\..+/.test(value.trim()))
      )
        return t("checkout.errorEmail");
      break;
    case "address":
      if (typeof value === "string" && !value.trim())
        return t("checkout.errorAddress");
      break;
    case "city":
      if (typeof value === "string" && !value.trim())
        return t("checkout.errorCity");
      break;
    case "postalCode":
      if (typeof value === "string" && !value.trim())
        return t("checkout.errorPostalCode");
      break;
    case "country":
      if (typeof value === "string" && !value)
        return t("checkout.errorCountry");
      break;
    case "termsAccepted":
      if (value !== true) return t("checkout.termsAcceptedError");
      break;
    case "privacyAccepted":
      if (value !== true) return t("checkout.privacyAcceptedError");
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
  "termsAccepted",
  "privacyAccepted",
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signInWithOAuth } = useAuth();
  const rawUploadedSlots = (
    (location.state as { uploadedSlots?: UploadedSlotResult[] } | null)
      ?.uploadedSlots ?? []
  ).filter(
    (slot): slot is UploadedCheckoutSlot =>
      !slot.error && typeof slot.transformedUrl === "string",
  );

  const uploadedSlots = (() => {
    if (rawUploadedSlots.length > 0) return rawUploadedSlots;
    try {
      const saved = sessionStorage.getItem(CHECKOUT_SLOTS_STORAGE);
      if (saved) return JSON.parse(saved) as UploadedCheckoutSlot[];
    } catch { /* ignore */ }
    return rawUploadedSlots;
  })();

  useEffect(() => {
    if (rawUploadedSlots.length > 0) {
      sessionStorage.setItem(CHECKOUT_SLOTS_STORAGE, JSON.stringify(rawUploadedSlots));
    }
  }, [rawUploadedSlots]);
  const itemCount = uploadedSlots.length > 0 ? uploadedSlots.length : 1;
  const totalPrice = itemCount * CANVAS_PRINT_UNIT_PRICE;

  const slotLabel = (slotKey: UploadedSlotResult["slotKey"]): string => {
    if (slotKey === "left") return t("upload.slotLeft");
    if (slotKey === "right") return t("upload.slotRight");
    return t("upload.slotCenter");
  };

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = sessionStorage.getItem("checkout-form-draft");
      if (saved) return JSON.parse(saved) as FormData;
    } catch {
      // ignore malformed data
    }
    return {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      termsAccepted: false,
      privacyAccepted: false,
      marketingConsent: false,
    };
  });

  useEffect(() => {
    sessionStorage.setItem("checkout-form-draft", JSON.stringify(formData));
  }, [formData]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [submissionKey, setSubmissionKey] = useState<string>(() => {
    try {
      const existing = sessionStorage.getItem(ORDER_SUBMISSION_KEY_STORAGE);
      if (existing && existing.trim().length > 0) {
        return existing;
      }

      const nextKey = generateOrderSubmissionKey();
      sessionStorage.setItem(ORDER_SUBMISSION_KEY_STORAGE, nextKey);
      return nextKey;
    } catch {
      return generateOrderSubmissionKey();
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [p24Error, setP24Error] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isBackDialogOpen, setIsBackDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const paymentReturn = searchParams.get("payment") === "return";
  const returnOrderId = searchParams.get("orderId");
  const returnOrderNumber = searchParams.get("orderNumber");

  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return sessionStorage.getItem(CHECKOUT_COUPON_CODE_STORAGE) ?? "";
    } catch {
      return "";
    }
  });
  const [couponResult, setCouponResult] = useState<ValidateCouponResponse | null>(() => {
    try {
      const saved = sessionStorage.getItem(CHECKOUT_COUPON_RESULT_STORAGE);
      if (saved) return JSON.parse(saved) as ValidateCouponResponse;
    } catch {
      // ignore malformed data
    }
    return null;
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_COUPON_CODE_STORAGE, couponCode);
  }, [couponCode]);

  useEffect(() => {
    if (couponResult) {
      sessionStorage.setItem(CHECKOUT_COUPON_RESULT_STORAGE, JSON.stringify(couponResult));
    } else {
      sessionStorage.removeItem(CHECKOUT_COUPON_RESULT_STORAGE);
    }
  }, [couponResult]);

  useEffect(() => {
    if (couponCode.trim() || couponResult?.valid) return;
    let pendingCode: string | null = null;
    try {
      pendingCode = sessionStorage.getItem("pending_coupon_code");
    } catch {
      // sessionStorage may be unavailable
    }
    if (!pendingCode) return;
    sessionStorage.removeItem("pending_coupon_code");
    setCouponCode(pendingCode);
    let cancelled = false;
    setCouponLoading(true);
    validateCoupon(pendingCode, totalPrice)
      .then((result) => {
        if (cancelled) return;
        setCouponResult(result);
        if (!result.valid) {
          setCouponError(result.reason ?? "Invalid coupon.");
        }
      })
      .catch(() => {
        if (!cancelled) setCouponError("Could not validate coupon.");
      })
      .finally(() => {
        if (!cancelled) setCouponLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [paymentPollStatus, setPaymentPollStatus] = useState<"polling" | "paid" | "failed" | "timeout">("polling");

  useEffect(() => {
    if (!paymentReturn || !returnOrderId) return;

    const POLL_INTERVAL_MS = 5000;
    const POLL_TIMEOUT_MS = 5 * 60 * 1000;
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPaymentPollStatus("timeout");
        return;
      }

      try {
        const result = await getOrderStatus(returnOrderId);

        if (result.status === "paid" || result.payment_status === "verified") {
          setPaymentPollStatus("paid");
          return;
        }
        if (result.payment_status === "failed") {
          setPaymentPollStatus("failed");
          return;
        }
      } catch {
        // Ignore poll errors, retry next interval
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [paymentReturn, returnOrderId]);

  const discountAmount = couponResult?.valid && couponResult.discountAmount
    ? couponResult.discountAmount
    : 0;
  const finalPrice = totalPrice - discountAmount;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    setFormData((prev) => {
      if (prev.email) return prev;
      return { ...prev, email: user.email ?? prev.email };
    });

    getCustomerAddresses().then((addresses) => {
      if (cancelled) return;
      const defaultAddr = addresses.find((a: CustomerAddress) => a.is_default) ?? addresses[0];
      if (defaultAddr && !formData.name) {
        setFormData((prev) => ({
          ...prev,
          name: defaultAddr.name,
          phone: defaultAddr.phone ?? prev.phone,
          address: defaultAddr.address,
          city: defaultAddr.city,
          postalCode: defaultAddr.postal_code,
          country: defaultAddr.country,
        }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);
    try {
      const result = await validateCoupon(couponCode.trim(), totalPrice);
      setCouponResult(result);
      if (!result.valid) {
        setCouponError(result.reason ?? "Invalid coupon.");
      }
    } catch {
      setCouponError("Could not validate coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponResult(null);
    setCouponError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenericError(null);
    setP24Error(null);

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
      const orderResponse = await createOrder({
        customer: formData,
        uploadedSlots,
        idempotencyKey: submissionKey,
        couponCode: couponResult?.valid ? couponResult.code : undefined,
        userId: user?.id,
      });

      sessionStorage.setItem(
        PENDING_ORDER_ID_STORAGE,
        orderResponse.orderId,
      );
      setOrderNumber(orderResponse.orderNumber);
      setPendingOrderId(orderResponse.orderId);

      try {
        setIsRedirecting(true);
        const p24Response = await createP24Session({
          orderId: orderResponse.orderId,
          language: getCurrentLanguage(),
        });

        sessionStorage.removeItem("checkout-form-draft");
        sessionStorage.removeItem(ORDER_SUBMISSION_KEY_STORAGE);
        sessionStorage.removeItem(PENDING_ORDER_ID_STORAGE);
        sessionStorage.removeItem(CHECKOUT_SLOTS_STORAGE);
        sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
        sessionStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE);
        sessionStorage.removeItem(CHECKOUT_COUPON_RESULT_STORAGE);
        removeReferralCookie();
        setSubmissionKey(generateOrderSubmissionKey());

        window.location.href = p24Response.redirectUrl;
      } catch (p24Err) {
        setIsRedirecting(false);
        setP24Error(
          p24Err instanceof Error && p24Err.message
            ? p24Err.message
            : t("checkout.paymentSessionError"),
        );
        sessionStorage.removeItem(ORDER_SUBMISSION_KEY_STORAGE);
        setSubmissionKey(generateOrderSubmissionKey());
      }
    } catch (error) {
      setGenericError(
        error instanceof Error && error.message
          ? error.message
          : t("checkout.errorGeneric"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!pendingOrderId) return;
    setP24Error(null);
    setIsRedirecting(true);
    try {
      const p24Response = await createP24Session({
        orderId: pendingOrderId,
        language: getCurrentLanguage(),
      });
      sessionStorage.removeItem("checkout-form-draft");
      sessionStorage.removeItem(ORDER_SUBMISSION_KEY_STORAGE);
      sessionStorage.removeItem(PENDING_ORDER_ID_STORAGE);
      sessionStorage.removeItem(CHECKOUT_SLOTS_STORAGE);
      sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      sessionStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE);
      sessionStorage.removeItem(CHECKOUT_COUPON_RESULT_STORAGE);
      removeReferralCookie();
      window.location.href = p24Response.redirectUrl;
    } catch (p24Err) {
      setIsRedirecting(false);
      setP24Error(
        p24Err instanceof Error && p24Err.message
          ? p24Err.message
          : t("checkout.paymentSessionError"),
      );
    }
  };

  const handleRetryPaymentFromReturn = async () => {
    if (!returnOrderId) return;
    setIsRedirecting(true);
    try {
      const p24Response = await createP24Session({
        orderId: returnOrderId,
        language: getCurrentLanguage(),
      });
      window.location.href = p24Response.redirectUrl;
    } catch {
      setIsRedirecting(false);
      setPaymentPollStatus("failed");
    }
  };

  const isFormValid = REQUIRED_FIELDS.every((f) => {
    const value = formData[f];
    return typeof value === "string" ? value.trim() : value === true;
  });
  const fieldError = (field: keyof FormData) =>
    touched[field] && errors[field] ? errors[field] : undefined;

  useEffect(() => {
    try {
      sessionStorage.setItem(ORDER_SUBMISSION_KEY_STORAGE, submissionKey);
    } catch {
      // Ignore storage errors; request still carries in-memory key.
    }
  }, [submissionKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => setIsBackDialogOpen(true)}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          {t("checkout.backToUpload")}
        </button>

        <AlertDialog open={isBackDialogOpen} onOpenChange={setIsBackDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("checkout.backToUploadDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("checkout.backToUploadDialogDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("checkout.backToUploadDialogCancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  sessionStorage.removeItem(CHECKOUT_SLOTS_STORAGE);
                  navigate("/upload", {
                    state: { restoredSlots: uploadedSlots },
                  });
                }}
              >
                {t("checkout.backToUploadDialogConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <ShoppingBag className="h-10 w-10 text-blue-600" />
            {t("checkout.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("checkout.subtitle")}</p>
        </div>

        {/* Order Summary */}
        <div className="mb-8 max-w-2xl mx-auto">
          <OrderSummary
            uploadedSlots={uploadedSlots}
            totalPrice={totalPrice}
            slotLabel={slotLabel}
          />

          {/* Coupon Code */}
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t("checkout.coupon.title")}
                </span>
              </div>
              {couponResult?.valid ? (
                <div className="flex items-center justify-between bg-green-50 rounded-md p-2 border border-green-200">
                  <span className="text-sm text-green-700">
                    {t("checkout.coupon.applied")}: <strong>{couponResult.code}</strong>
                    {couponResult.discountType === "percentage"
                      ? ` (-${couponResult.discountValue}%)`
                      : ` (-${formatPrice(couponResult.discountAmount ?? 0)})`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    {t("checkout.coupon.remove")}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t("checkout.coupon.placeholder")}
                    className="flex-1"
                    disabled={couponLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("checkout.coupon.apply")
                    )}
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-600 mt-1">{couponError}</p>
              )}
            </div>
          </div>

          {discountAmount > 0 && (
            <div className="max-w-2xl mx-auto mt-2 bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t("checkout.coupon.subtotal")}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>{t("checkout.coupon.discount")}</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1">
                <span>{t("checkout.total")}</span>
                <span className="text-blue-600">{formatPrice(finalPrice)}</span>
              </div>
            </div>
          )}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("checkout.shippingInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentReturn ? (
              <div className="py-12 text-center">
                {paymentPollStatus === "paid" ? (
                  <>
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("checkout.paymentSuccessTitle")}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t("checkout.paymentSuccessMessage")}
                    </p>
                  </>
                ) : paymentPollStatus === "failed" ? (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("checkout.paymentFailedTitle")}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t("checkout.paymentFailedMessage")}
                    </p>
                  </>
                ) : paymentPollStatus === "timeout" ? (
                  <>
                    <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("checkout.paymentTimeoutTitle")}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t("checkout.paymentTimeoutMessage")}
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("checkout.paymentPendingTitle")}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {t("checkout.paymentPendingMessage")}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {t("checkout.paymentCheckingStatus")}
                    </p>
                  </>
                )}
                {(returnOrderId || returnOrderNumber) && (
                  <p className="text-sm text-gray-500 mb-6">
                    {t("checkout.orderNumber")}:{" "}
                    <span className="font-mono font-semibold">
                      {returnOrderNumber || returnOrderId}
                    </span>
                  </p>
                )}
                {paymentPollStatus === "failed" && returnOrderId ? (
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleRetryPaymentFromReturn}>
                      {t("checkout.paymentRetryButton")}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      {t("checkout.backToHomeButton")}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => navigate("/")}>
                    {t("checkout.backToHomeButton")}
                  </Button>
                )}
              </div>
            ) : isRedirecting ? (
              <div className="py-12 text-center">
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("checkout.redirectingToPayment")}
                </h2>
                {orderNumber && (
                  <p className="text-sm text-gray-500">
                    {t("checkout.orderNumber")}:{" "}
                    <span className="font-mono font-semibold">
                      {orderNumber}
                    </span>
                  </p>
                )}
              </div>
            ) : p24Error && orderNumber ? (
              <div className="py-12 text-center">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("checkout.paymentRetryTitle")}
                </h2>
                <p className="text-gray-600 mb-2">
                  {t("checkout.paymentRetryMessage")}
                </p>
                <p className="text-sm text-red-600 mb-2">{p24Error}</p>
                <p className="text-sm text-gray-500 mb-6">
                  {t("checkout.orderNumber")}:{" "}
                  <span className="font-mono font-semibold">
                    {orderNumber}
                  </span>
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRetryPayment}>
                    {t("checkout.paymentRetryButton")}
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    {t("checkout.backToHomeButton")}
                  </Button>
                </div>
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

                {!authLoading && !user && (
                  <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5 text-blue-600 shrink-0" />
                      <p className="text-sm text-blue-800">
                        {t("checkout.loginPrompt")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => {
                          sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, "true");
                          signInWithOAuth("google");
                        }}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => {
                          sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, "true");
                          signInWithOAuth("facebook");
                        }}
                      >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => navigate("/auth", { state: { from: { pathname: "/checkout" } } })}
                      >
                        {t("checkout.loginWithEmail")}
                      </Button>
                    </div>
                  </div>
                )}

                {!authLoading && user && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800">
                      {t("checkout.loggedInAs", { email: user.email ?? "" })}
                    </p>
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

                {/* Przelewy24 Legal Consents - Required */}
                <fieldset className="space-y-3">
                  <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2 w-full">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    {t("checkout.consents.title")}
                  </legend>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        id="termsAccepted"
                        name="termsAccepted"
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            termsAccepted: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                        required
                        aria-required="true"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label
                        htmlFor="termsAccepted"
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {t("checkout.consents.termsLabel")}{" "}
                        <Link
                          to="/terms"
                          state={{ from: location.pathname }}
                          className="text-blue-600 hover:underline"
                        >
                          {t("checkout.consents.termsLink")}
                        </Link>
                        ,{" "}
                        <Link
                          to="/privacy"
                          state={{ from: location.pathname }}
                          className="text-blue-600 hover:underline"
                        >
                          {t("checkout.consents.privacyLink")}
                        </Link>
                        {t("checkout.consents.termsSuffix")}
                      </label>
                    </div>
                    {fieldError("termsAccepted") && (
                      <p
                        id="termsAccepted-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600 ml-7"
                      >
                        {fieldError("termsAccepted")}
                      </p>
                    )}

                    <div className="flex items-start gap-3">
                      <input
                        id="privacyAccepted"
                        name="privacyAccepted"
                        type="checkbox"
                        checked={formData.privacyAccepted}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacyAccepted: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                        required
                        aria-required="true"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label
                        htmlFor="privacyAccepted"
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {t("checkout.consents.privacyLabel")}
                      </label>
                    </div>
                    {fieldError("privacyAccepted") && (
                      <p
                        id="privacyAccepted-error"
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-red-600 ml-7"
                      >
                        {fieldError("privacyAccepted")}
                      </p>
                    )}

                    <div className="flex items-start gap-3">
                      <input
                        id="marketingConsent"
                        name="marketingConsent"
                        type="checkbox"
                        checked={formData.marketingConsent}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            marketingConsent: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label
                        htmlFor="marketingConsent"
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {t("checkout.consents.marketingLabel")}
                      </label>
                    </div>
                  </div>
                </fieldset>

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

                {/* Mobile-only compact total reminder */}
                <div className="md:hidden pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {t("checkout.total")}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
