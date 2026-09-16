import { createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
};

type ShippingMethodRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  delivery_time: string | null;
  free_shipping_threshold: number | string | null;
  is_default: boolean;
  sort_order: number;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        shippingMethods: [],
        error: "Supabase client init failed",
        detail: e instanceof Error ? e.message : String(e),
      }),
    };
  }

  const { data: methods, error: fetchError } = await supabase
    .from("shipping_methods")
    .select(
      "id, name, description, price, currency, delivery_time, free_shipping_threshold, is_default, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchError) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        shippingMethods: [],
        error: "Query failed",
        detail: fetchError.message,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      shippingMethods: (methods ?? []).map((method: ShippingMethodRow) => ({
        id: method.id,
        name: method.name,
        description: method.description,
        price: Number(method.price),
        currency: method.currency,
        deliveryTime: method.delivery_time,
        freeShippingThreshold:
          method.free_shipping_threshold === null
            ? null
            : Number(method.free_shipping_threshold),
        isDefault: method.is_default,
      })),
    }),
  };
};
