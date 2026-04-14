import { createClient } from "@supabase/supabase-js";
import { SHIPPING_COUNTRIES } from "../../src/lib/checkout-constants";
import { CANVAS_PRINT_UNIT_PRICE } from "../../src/lib/pricing";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

type CustomerInput = {
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

type UploadedSlotInput = {
  slotIndex: number;
  slotKey: "left" | "center" | "right";
  transformedUrl: string;
  publicId?: string;
  secureUrl?: string;
  transformations: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    brightness: number;
    contrast: number;
    grayscale: number;
    blur: number;
  };
  aiAdjustments?: {
    enhance: boolean;
    removeBackground: boolean;
    upscale: boolean;
    restore: boolean;
  };
};

type CreateOrderPayload = {
  customer?: CustomerInput;
  uploadedSlots?: UploadedSlotInput[];
  idempotencyKey?: string;
  couponCode?: string;
  refCode?: string;
  userId?: string;
};

const DEFAULT_SHIPPING_METHOD = "inpost_courier";
const DEFAULT_SHIPPING_COST = 14.99;
const DEFAULT_SHIPMENT_STATUS = "pending_fulfillment";

let hasLoggedSupabaseKeyMode = false;

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email.trim());
}

function validateCustomer(customer: CustomerInput): string | null {
  if (!customer.name.trim()) return "Missing required customer name.";
  if (!isValidEmail(customer.email)) return "Invalid customer email.";
  if (!customer.address.trim()) return "Missing shipping address.";
  if (!customer.city.trim()) return "Missing shipping city.";
  if (!customer.postalCode.trim()) return "Missing postal code.";

  const allowedCountries = new Set(SHIPPING_COUNTRIES.map((c) => c.value));
  if (!allowedCountries.has(customer.country)) {
    return "Country is not supported for shipping.";
  }

  if (customer.termsAccepted !== true) {
    return "Terms consent is required.";
  }

  if (customer.privacyAccepted !== true) {
    return "Privacy consent is required.";
  }

  return null;
}

function validateSlots(slots: UploadedSlotInput[]): string | null {
  if (slots.length > 3) {
    return "Too many uploaded slots. Expected at most 3.";
  }

  const seen = new Set<string>();

  for (const slot of slots) {
    if (!Number.isInteger(slot.slotIndex) || slot.slotIndex < 0 || slot.slotIndex > 2) {
      return "Invalid slot index.";
    }

    if (!slot.transformedUrl || !slot.transformedUrl.trim()) {
      return "Each uploaded slot must include transformed URL.";
    }

    if (seen.has(slot.slotKey)) {
      return "Duplicate slot keys are not allowed.";
    }

    seen.add(slot.slotKey);
  }

  return null;
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const hasSecretKey = typeof process.env.SUPABASE_SECRET_KEY === "string";
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.",
      }),
    };
  }

  if (!hasLoggedSupabaseKeyMode) {
    const keyMode = hasSecretKey ? "secret" : "missing";

    console.info(`[create-order] Supabase key mode: ${keyMode}`);
    hasLoggedSupabaseKeyMode = true;
  }

  let parsedBody: CreateOrderPayload;

  try {
    parsedBody = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload." }),
    };
  }

  if (!parsedBody.customer) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing customer payload." }),
    };
  }

  const slots = Array.isArray(parsedBody.uploadedSlots)
    ? parsedBody.uploadedSlots
    : [];
  const idempotencyKey = parsedBody.idempotencyKey?.trim();

  if (!idempotencyKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing idempotency key." }),
    };
  }

  if (idempotencyKey.length > 128) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Idempotency key is too long." }),
    };
  }

  const customerValidationError = validateCustomer(parsedBody.customer);
  if (customerValidationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: customerValidationError }),
    };
  }

  const slotsValidationError = validateSlots(slots);
  if (slotsValidationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: slotsValidationError }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const itemCount = slots.length > 0 ? slots.length : 1;
  const subtotal = itemCount * CANVAS_PRINT_UNIT_PRICE;

  let couponId: string | null = null;
  let couponCode: string | null = null;
  let discountAmount = 0;

  const couponCodeInput = parsedBody.couponCode?.trim().toUpperCase();
  if (couponCodeInput) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, is_active")
      .eq("code", couponCodeInput)
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      const now = new Date();
      const isValidFrom = !coupon.valid_from || new Date(coupon.valid_from) <= now;
      const isValidUntil = !coupon.valid_until || new Date(coupon.valid_until) >= now;
      const isWithinMaxUses = coupon.max_uses === null || coupon.used_count < coupon.max_uses;
      const meetsMinAmount = coupon.min_order_amount === null || subtotal >= coupon.min_order_amount;

      if (isValidFrom && isValidUntil && isWithinMaxUses && meetsMinAmount) {
        couponId = coupon.id;
        couponCode = coupon.code;
        if (coupon.discount_type === "percentage") {
          discountAmount = Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100;
        } else {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
      }
    }
  }

  const totalPrice = Math.max(subtotal - discountAmount, 0);

  const orderInsert: Record<string, unknown> = {
    customer_name: parsedBody.customer.name.trim(),
    customer_email: parsedBody.customer.email.trim(),
    customer_phone: parsedBody.customer.phone.trim() || null,
    shipping_address: parsedBody.customer.address.trim(),
    shipping_city: parsedBody.customer.city.trim(),
    shipping_postal_code: parsedBody.customer.postalCode.trim(),
    shipping_country: parsedBody.customer.country,
    terms_accepted: parsedBody.customer.termsAccepted,
    privacy_accepted: parsedBody.customer.privacyAccepted,
    marketing_consent: parsedBody.customer.marketingConsent,
    status: "pending_payment",
    shipping_method: DEFAULT_SHIPPING_METHOD,
    shipping_cost: DEFAULT_SHIPPING_COST,
    shipment_status: DEFAULT_SHIPMENT_STATUS,
    currency: "PLN",
    idempotency_key: idempotencyKey,
    items_count: itemCount,
    unit_price: CANVAS_PRINT_UNIT_PRICE,
    total_price: totalPrice,
    discount_amount: discountAmount,
  };

  if (couponId) {
    orderInsert.coupon_id = couponId;
    orderInsert.coupon_code = couponCode;
  }

  const refCodeInput = parsedBody.refCode?.trim();
  if (refCodeInput) {
    orderInsert.ref_code = refCodeInput;
  }

  const userIdInput = parsedBody.userId?.trim();
  if (userIdInput) {
    orderInsert.user_id = userIdInput;
  }

  const { data: order, error: orderInsertError } = await supabase
    .from("orders")
    .insert(orderInsert)
    .select("id, order_number, status")
    .single();

  if (orderInsertError?.code === "23505") {
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (!existingOrderError && existingOrder) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          status: existingOrder.status,
        }),
      };
    }
  }

  if (orderInsertError || !order) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create order." }),
    };
  }

  if (slots.length > 0) {
    const { error: itemsInsertError } = await supabase.from("order_items").insert(
      slots.map((slot) => ({
        order_id: order.id,
        slot_index: slot.slotIndex,
        slot_key: slot.slotKey,
        transformed_url: slot.transformedUrl,
        public_id: slot.publicId ?? null,
        secure_url: slot.secureUrl ?? null,
        transformations: slot.transformations,
        ai_adjustments: slot.aiAdjustments ?? null,
      })),
    );

    if (itemsInsertError) {
      await supabase.from("orders").delete().eq("id", order.id);

      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not persist order items." }),
      };
    }
  }

  const { error: historyInsertError } = await supabase
    .from("order_status_history")
    .insert([
      {
        order_id: order.id,
        status_type: "order",
        status: order.status,
        note: "Order created.",
      },
      {
        order_id: order.id,
        status_type: "shipment",
        status: DEFAULT_SHIPMENT_STATUS,
        note: "Shipment initialized.",
      },
    ]);

  if (historyInsertError) {
    await supabase.from("orders").delete().eq("id", order.id);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not persist order status history." }),
    };
  }

  if (couponId) {
    await supabase.rpc("increment_coupon_used_count", { coupon_row_id: couponId });

    await supabase.from("coupon_usages").insert({
      coupon_id: couponId,
      user_id: userIdInput || null,
      order_id: order.id,
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
    }),
  };
};
