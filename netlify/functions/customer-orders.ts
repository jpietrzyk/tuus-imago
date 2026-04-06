import { getAuthenticatedUser, createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  items_count: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_status: string;
  payment_provider: string | null;
  payment_paid_at: string | null;
  shipment_status: string;
  tracking_number: string | null;
  shipping_method: string;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  slot_key: string;
  slot_index: number;
  transformed_url: string;
  transformations: Record<string, unknown>;
  ai_adjustments: Record<string, unknown> | null;
};

type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const authResult = await getAuthenticatedUser(event);
  if ("error" in authResult) return authResult.error;

  const userId = authResult.user.id;
  const orderId = event.queryStringParameters?.["orderId"];

  const supabase = createServiceClient();

  if (orderId) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (orderError || !order) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Order not found." }),
      };
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("id, slot_key, slot_index, transformed_url, transformations, ai_adjustments")
      .eq("order_id", orderId);

    return {
      statusCode: 200,
      body: JSON.stringify({ order: { ...order, items: items ?? [] } }),
    };
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not fetch orders." }),
    };
  }

  if (!orders || orders.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ orders: [] }),
    };
  }

  const orderIds = orders.map((o: OrderRow) => o.id);

  const { data: allItems } = await supabase
    .from("order_items")
    .select("id, order_id, slot_key, slot_index, transformed_url, transformations, ai_adjustments")
    .in("order_id", orderIds);

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of allItems ?? []) {
    const existing = itemsByOrder.get(item.order_id) ?? [];
    existing.push(item);
    itemsByOrder.set(item.order_id, existing);
  }

  const ordersWithItems: OrderWithItems[] = orders.map((order: OrderRow) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ orders: ordersWithItems }),
  };
};
