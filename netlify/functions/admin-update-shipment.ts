import { createClient } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

type ShipmentStatus =
  | "pending_fulfillment"
  | "in_transit"
  | "delivered"
  | "failed_delivery"
  | "returned";

type UpdateShipmentPayload = {
  orderId?: string;
  shipmentStatus?: ShipmentStatus;
  trackingNumber?: string | null;
  note?: string;
};

const ALLOWED_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending_fulfillment",
  "in_transit",
  "delivered",
  "failed_delivery",
  "returned",
];

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending_fulfillment: ["in_transit", "failed_delivery", "returned"],
  in_transit: ["delivered", "failed_delivery", "returned"],
  delivered: ["returned"],
  failed_delivery: ["in_transit", "returned"],
  returned: [],
};

function getHeader(
  headers: Record<string, string | undefined> | undefined,
  name: string,
): string | null {
  if (!headers) return null;

  const direct = headers[name];
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const lower = headers[name.toLowerCase()];
  if (typeof lower === "string" && lower.length > 0) {
    return lower;
  }

  const upper = headers[name.toUpperCase()];
  if (typeof upper === "string" && upper.length > 0) {
    return upper;
  }

  return null;
}

function isShipmentStatus(value: string): value is ShipmentStatus {
  return ALLOWED_SHIPMENT_STATUSES.includes(value as ShipmentStatus);
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const expectedToken = process.env.ADMIN_SHIPMENT_TOKEN;
  const providedToken = getHeader(event.headers, "x-admin-token");

  if (!expectedToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "Missing ADMIN_SHIPMENT_TOKEN in server environment for shipment admin endpoint.",
      }),
    };
  }

  if (!providedToken || providedToken !== expectedToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
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

  let parsedBody: UpdateShipmentPayload;

  try {
    parsedBody = JSON.parse(event.body || "{}");
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

  const shipmentStatus = parsedBody.shipmentStatus?.trim();
  if (!shipmentStatus || !isShipmentStatus(shipmentStatus)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Invalid shipmentStatus. Allowed: ${ALLOWED_SHIPMENT_STATUSES.join(", ")}.`,
      }),
    };
  }

  const trackingNumber =
    typeof parsedBody.trackingNumber === "string"
      ? parsedBody.trackingNumber.trim()
      : null;
  const note = parsedBody.note?.trim() || null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("id, order_number, shipment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not load order." }),
    };
  }

  if (!existingOrder) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Order not found." }),
    };
  }

  if (!isShipmentStatus(existingOrder.shipment_status)) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Order has unsupported current shipment status.",
      }),
    };
  }

  const currentStatus = existingOrder.shipment_status;
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus];
  const isSameStatus = shipmentStatus === currentStatus;

  if (!isSameStatus && !allowedNextStatuses.includes(shipmentStatus)) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error: `Invalid shipment status transition from ${currentStatus} to ${shipmentStatus}. Allowed next statuses: ${allowedNextStatuses.join(", ") || "none"}.`,
      }),
    };
  }

  const { data: updatedOrder, error: updateOrderError } = await supabase
    .from("orders")
    .update({
      shipment_status: shipmentStatus,
      tracking_number: trackingNumber && trackingNumber.length > 0
        ? trackingNumber
        : null,
    })
    .eq("id", orderId)
    .select("id, order_number, shipment_status, tracking_number")
    .single();

  if (updateOrderError || !updatedOrder) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not update shipment." }),
    };
  }

  const historyNote =
    note ||
    (isSameStatus
      ? "Shipment details updated."
      : `Shipment status changed from ${currentStatus} to ${shipmentStatus}.`);

  const { error: historyError } = await supabase
    .from("order_status_history")
    .insert({
      order_id: orderId,
      status_type: "shipment",
      status: shipmentStatus,
      note: historyNote,
    });

  if (historyError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Shipment updated but history insert failed." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      shipmentStatus: updatedOrder.shipment_status,
      trackingNumber: updatedOrder.tracking_number,
    }),
  };
};
