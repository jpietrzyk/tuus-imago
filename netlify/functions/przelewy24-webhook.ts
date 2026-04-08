import { createClient } from "@supabase/supabase-js";
import {
  buildNotificationSign,
  buildP24AuthHeader,
  buildVerifySign,
  getP24Config,
  parseP24Response,
  parseRequestJson,
  toMinorUnits,
  type P24NotificationPayload,
} from "./_shared/przelewy24";
import {
  buildContactProperties,
  getHubSpotConfig,
  upsertHubSpotContact,
  type OrderRow as HubSpotOrderRow,
} from "./_shared/hubspot";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  total_price: number | string;
  payment_status: string;
  payment_order_id: number | null;
};

type P24VerifyResponse = {
  data?: {
    status?: string;
  };
  error?: string;
};

function isValidNotificationPayload(payload: Record<string, unknown>): payload is P24NotificationPayload {
  return typeof payload.sessionId === "string"
    && typeof payload.currency === "string"
    && typeof payload.statement === "string"
    && typeof payload.sign === "string"
    && Number.isInteger(payload.merchantId)
    && Number.isInteger(payload.posId)
    && Number.isInteger(payload.amount)
    && Number.isInteger(payload.originAmount)
    && Number.isInteger(payload.orderId)
    && Number.isInteger(payload.methodId);
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

  let parsedBody: Record<string, unknown>;

  try {
    parsedBody = await parseRequestJson<Record<string, unknown>>(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload." }),
    };
  }

  if (!isValidNotificationPayload(parsedBody)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid Przelewy24 notification payload." }),
    };
  }

  const expectedSign = buildNotificationSign({
    merchantId: parsedBody.merchantId,
    posId: parsedBody.posId,
    sessionId: parsedBody.sessionId,
    amount: parsedBody.amount,
    originAmount: parsedBody.originAmount,
    currency: parsedBody.currency,
    orderId: parsedBody.orderId,
    methodId: parsedBody.methodId,
    statement: parsedBody.statement,
    crc: config.crc,
  });

  if (parsedBody.sign !== expectedSign) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid Przelewy24 notification signature." }),
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
    .select("id, order_number, status, currency, total_price, payment_status, payment_order_id")
    .eq("payment_session_id", parsedBody.sessionId)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not load order for payment verification." }),
    };
  }

  if (!order) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Order not found for payment session." }),
    };
  }

  const expectedAmount = toMinorUnits(order.total_price);

  if (parsedBody.amount !== expectedAmount || parsedBody.originAmount !== expectedAmount) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Payment amount does not match the stored order total." }),
    };
  }

  if (parsedBody.currency !== order.currency) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Payment currency does not match the stored order currency." }),
    };
  }

  if (order.payment_status === "verified" && order.payment_order_id === parsedBody.orderId) {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "already_verified" }),
    };
  }

  const verifyResponse = await fetch(`${config.apiBaseUrl}/transaction/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildP24AuthHeader(config.posId, config.apiKey),
    },
    body: JSON.stringify({
      merchantId: config.merchantId,
      posId: config.posId,
      sessionId: parsedBody.sessionId,
      amount: parsedBody.amount,
      currency: parsedBody.currency,
      orderId: parsedBody.orderId,
      sign: buildVerifySign({
        sessionId: parsedBody.sessionId,
        orderId: parsedBody.orderId,
        amount: parsedBody.amount,
        currency: parsedBody.currency,
        crc: config.crc,
      }),
    }),
  });

  const verifyData = await parseP24Response<P24VerifyResponse>(verifyResponse);

  if (!verifyResponse.ok || verifyData?.data?.status !== "success") {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: verifyData?.error || "Could not verify Przelewy24 payment.",
      }),
    };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_provider: "przelewy24",
      payment_status: "verified",
      payment_order_id: parsedBody.orderId,
      payment_method_id: parsedBody.methodId,
      payment_paid_at: now,
      payment_verified_at: now,
      payment_error: null,
    })
    .eq("id", order.id);

  if (updateError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Payment verified but order update failed." }),
    };
  }

  const { error: historyError } = await supabase.from("order_status_history").insert([
    {
      order_id: order.id,
      status_type: "payment",
      status: "verified",
      note: `Przelewy24 payment verified for P24 order ${parsedBody.orderId}.`,
    },
    {
      order_id: order.id,
      status_type: "order",
      status: "paid",
      note: "Order marked as paid after Przelewy24 verification.",
    },
  ]);

  if (historyError) {
    console.error("[przelewy24-webhook] Could not write payment verification history.");
  }

  try {
    const hsConfig = getHubSpotConfig();
    const { data: fullOrder } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, total_price, items_count, marketing_consent, created_at",
      )
      .eq("id", order.id)
      .single<HubSpotOrderRow>();

    if (fullOrder) {
      const contactProperties = buildContactProperties(fullOrder);
      const hubspotResponse = await upsertHubSpotContact(hsConfig, contactProperties);

      const hsUpdateFields: Record<string, unknown> = {
        hubspot_synced_at: new Date().toISOString(),
      };
      if (hubspotResponse.id) {
        hsUpdateFields.hubspot_contact_id = hubspotResponse.id;
      }

      await supabase.from("orders").update(hsUpdateFields).eq("id", order.id);

      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status_type: "crm",
        status: "hubspot_synced",
        note: `Contact re-synced to HubSpot CRM after payment verification${hubspotResponse.id ? ` (ID: ${hubspotResponse.id})` : ""}.`,
      });
    }
  } catch (hsError) {
    console.error("[przelewy24-webhook] HubSpot re-sync failed:", hsError instanceof Error ? hsError.message : hsError);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "verified" }),
  };
};
