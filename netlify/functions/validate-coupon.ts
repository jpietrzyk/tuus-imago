import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

type ValidateCouponPayload = {
  code?: string;
  orderTotal?: number;
};

type CouponRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  currency: string;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

function computeDiscount(
  coupon: CouponRow,
  orderTotal: number,
): number {
  if (coupon.discount_type === "percentage") {
    return Math.round(orderTotal * (coupon.discount_value / 100) * 100) / 100;
  }
  return Math.min(coupon.discount_value, orderTotal);
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let parsed: ValidateCouponPayload;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload." }),
    };
  }

  const code = parsed.code?.trim().toUpperCase();
  const orderTotal = parsed.orderTotal;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing coupon code." }),
    };
  }

  if (typeof orderTotal !== "number" || orderTotal <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid order total." }),
    };
  }

  const supabase = createServiceClient();

  const { data: coupon, error: fetchError } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (fetchError || !coupon) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: "Coupon not found or inactive." }),
    };
  }

  const now = new Date();
  const typedCoupon = coupon as CouponRow;

  if (typedCoupon.valid_from && new Date(typedCoupon.valid_from) > now) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: "Coupon is not yet valid." }),
    };
  }

  if (typedCoupon.valid_until && new Date(typedCoupon.valid_until) < now) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: "Coupon has expired." }),
    };
  }

  if (typedCoupon.max_uses !== null && typedCoupon.used_count >= typedCoupon.max_uses) {
    return {
      statusCode: 200,
      body: JSON.stringify({ valid: false, reason: "Coupon usage limit reached." }),
    };
  }

  if (typedCoupon.min_order_amount !== null && orderTotal < typedCoupon.min_order_amount) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: false,
        reason: `Minimum order amount is ${typedCoupon.min_order_amount} ${typedCoupon.currency}.`,
      }),
    };
  }

  const discountAmount = computeDiscount(typedCoupon, orderTotal);

  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: true,
      couponId: typedCoupon.id,
      code: typedCoupon.code,
      discountType: typedCoupon.discount_type,
      discountValue: typedCoupon.discount_value,
      discountAmount,
    }),
  };
};
