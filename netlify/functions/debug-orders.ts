import { createClient } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
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

function resolveLimit(input: string | undefined): number {
  const parsed = Number.parseInt(input ?? "10", 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), 50);
}

export const handler = async (event: NetlifyEvent) => {
  const debugOrdersEnabled = process.env.DEBUG_ORDERS_ENABLED === "true";

  if (!debugOrdersEnabled) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not Found" }),
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const expectedToken = process.env.DEBUG_ORDERS_TOKEN;
  const providedToken = getHeader(event.headers, "x-debug-token");

  if (!expectedToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "Missing DEBUG_ORDERS_TOKEN in server environment for debug endpoint.",
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

  const limit = resolveLimit(event.queryStringParameters?.limit);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, shipment_status, shipping_method, shipping_cost, tracking_number, customer_email, currency, total_price, items_count, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ordersError || !orders) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not fetch debug orders." }),
    };
  }

  const orderIds = orders.map((order) => order.id);
  const itemsByOrder = new Map<string, unknown[]>();
  const historyByOrder = new Map<string, unknown[]>();

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, slot_index, slot_key, transformed_url, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (itemsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not fetch debug order items." }),
      };
    }

    for (const item of items ?? []) {
      const bucket = itemsByOrder.get(item.order_id) ?? [];
      bucket.push(item);
      itemsByOrder.set(item.order_id, bucket);
    }

    const { data: historyRows, error: historyError } = await supabase
      .from("order_status_history")
      .select("order_id, status_type, status, note, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (historyError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Could not fetch debug order history." }),
      };
    }

    for (const row of historyRows ?? []) {
      const bucket = historyByOrder.get(row.order_id) ?? [];
      bucket.push(row);
      historyByOrder.set(row.order_id, bucket);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      meta: {
        debug: true,
        limit,
        count: orders.length,
      },
      data: orders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
        history: historyByOrder.get(order.id) ?? [],
      })),
    }),
  };
};
