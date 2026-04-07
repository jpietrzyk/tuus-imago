import { getAuthenticatedUser, createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const authResult = await getAuthenticatedUser(event);
  if ("error" in authResult) return authResult.error;

  const userId = authResult.user.id;
  const supabase = createServiceClient();

  const [profileResult, addressesResult, ordersResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, created_at, updated_at").eq("id", userId).maybeSingle(),
    supabase.from("addresses").select("*").eq("user_id", userId),
    supabase.from("orders").select("id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, items_count, unit_price, total_price, discount_amount, coupon_code, payment_status, payment_provider, payment_paid_at, shipping_method, shipping_cost, shipment_status, tracking_number, currency, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  let orderItems: unknown[] = [];
  if (ordersResult.data && ordersResult.data.length > 0) {
    const orderIds = ordersResult.data.map((o: { id: string }) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    orderItems = items ?? [];
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      createdAt: authResult.user.created_at,
    },
    profile: profileResult.data,
    addresses: addressesResult.data ?? [],
    orders: ordersResult.data ?? [],
    orderItems,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exportData, null, 2),
  };
};
