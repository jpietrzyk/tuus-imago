import { createClient } from "@supabase/supabase-js";
import {
  buildP24AuthHeader,
  buildRegisterSign,
  buildReturnUrl,
  getP24Config,
  parseP24Response,
  parseRequestJson,
  toMinorUnits,
} from "./_shared/przelewy24";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

type CreatePaymentSessionPayload = {
  orderId?: string;
  language?: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  currency: string;
  total_price: number | string;
  shipping_cost: number | string;
  payment_session_id: string | null;
  payment_token: string | null;
  payment_status: string;
};

type P24RegisterResponse = {
  data?: {
    token?: string;
  };
  error?: string;
  responseCode?: number;
};

function normalizeLanguage(language?: string) {
  return language?.toLowerCase() === "en" ? "en" : "pl";
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.",
      }),
    };
  }

  let config;

  try {
    config = getP24Config();
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Missing Przelewy24 configuration.",
      }),
    };
  }

  let parsedBody: CreatePaymentSessionPayload;

  try {
    parsedBody = await parseRequestJson<CreatePaymentSessionPayload>(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload." }),
    };
  }

  const orderId = parsedBody.orderId?.trim();

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing orderId." }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, currency, total_price, shipping_cost, payment_session_id, payment_token, payment_status",
    )
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not load order for payment." }),
    };
  }

  if (!order) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Order not found." }),
    };
  }

  if (order.status === "paid" || order.payment_status === "verified") {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "Order is already paid." }),
    };
  }

  if (order.payment_status === "registered" && order.payment_token && order.payment_session_id) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        paymentSessionId: order.payment_session_id,
        redirectUrl: `${config.panelBaseUrl}/trnRequest/${order.payment_token}`,
      }),
    };
  }

  const sessionId = order.payment_session_id || `order-${order.id}`;
  const amount = toMinorUnits(order.total_price);
  const shipping = toMinorUnits(order.shipping_cost);
  const currency = order.currency || "PLN";

  const registerPayload = {
    merchantId: config.merchantId,
    posId: config.posId,
    sessionId,
    amount,
    currency,
    description: `Order ${order.order_number}`,
    email: order.customer_email,
    client: order.customer_name,
    address: order.shipping_address,
    zip: order.shipping_postal_code,
    city: order.shipping_city,
    country: order.shipping_country,
    phone: order.customer_phone?.replace(/\s+/g, "") || undefined,
    language: normalizeLanguage(parsedBody.language),
    urlReturn: buildReturnUrl(config.siteUrl, order.id),
    urlStatus: config.statusUrl,
    waitForResult: false,
    regulationAccept: false,
    shipping,
    sign: buildRegisterSign({
      sessionId,
      merchantId: config.merchantId,
      amount,
      currency,
      crc: config.crc,
    }),
    encoding: "UTF-8",
  };

  const registerResponse = await fetch(`${config.apiBaseUrl}/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildP24AuthHeader(config.posId, config.apiKey),
    },
    body: JSON.stringify(registerPayload),
  });

  const registerData = await parseP24Response<P24RegisterResponse>(registerResponse);
  const token = registerData?.data?.token;

  if (!registerResponse.ok || !token) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: registerData?.error || "Could not register Przelewy24 transaction.",
      }),
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_provider: "przelewy24",
      payment_status: "registered",
      payment_session_id: sessionId,
      payment_token: token,
      payment_registered_at: now,
      payment_error: null,
    })
    .eq("id", order.id);

  if (updateError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Payment registered but order update failed." }),
    };
  }

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: order.id,
    status_type: "payment",
    status: "registered",
    note: "Przelewy24 transaction registered.",
  });

  if (historyError) {
    console.error("[create-przelewy24-session] Could not write payment history.");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      paymentSessionId: sessionId,
      redirectUrl: `${config.panelBaseUrl}/trnRequest/${token}`,
    }),
  };
};
