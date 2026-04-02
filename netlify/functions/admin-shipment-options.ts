import { createClient } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
};

type ShipmentStatus =
  | "pending_fulfillment"
  | "in_transit"
  | "delivered"
  | "failed_delivery"
  | "returned";

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
  if (event.httpMethod !== "GET") {
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

  const orderId = event.queryStringParameters?.orderId?.trim();

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing orderId query parameter." }),
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

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, shipment_status, tracking_number")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not load order." }),
    };
  }

  if (!order) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Order not found." }),
    };
  }

  if (!isShipmentStatus(order.shipment_status)) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Order has unsupported current shipment status.",
      }),
    };
  }

  const currentStatus = order.shipment_status;

  return {
    statusCode: 200,
    body: JSON.stringify({
      orderId: order.id,
      orderNumber: order.order_number,
      currentShipmentStatus: currentStatus,
      trackingNumber: order.tracking_number,
      allowedNextShipmentStatuses: STATUS_TRANSITIONS[currentStatus],
      allShipmentStatuses: ALLOWED_SHIPMENT_STATUSES,
    }),
  };
};
