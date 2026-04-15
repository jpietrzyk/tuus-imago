import { createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
};

type PromotionRow = {
  id: string;
  name: string;
  slogan: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  currency: string;
  min_order_amount: number | null;
  min_slots: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
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
      body: JSON.stringify({ active: false, error: "Supabase client init failed", detail: e instanceof Error ? e.message : String(e) }),
    };
  }

  const { data: allPromotions, error: listError } = await supabase
    .from("promotions")
    .select("id, name, is_active");

  if (listError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ active: false, error: "List query failed", detail: listError.message }),
    };
  }

  const { data: promotion, error: fetchError } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (fetchError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ active: false, error: "Query failed", detail: fetchError.message }),
    };
  }

  if (!promotion) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        active: false,
        reason: "no active promotion found",
        debug_allPromotions: allPromotions,
      }),
    };
  }

  const p = promotion as PromotionRow;

  const now = new Date();

  if (p.valid_from && new Date(p.valid_from) > now) {
    return {
      statusCode: 200,
      body: JSON.stringify({ active: false }),
    };
  }

  if (p.valid_until && new Date(p.valid_until) < now) {
    return {
      statusCode: 200,
      body: JSON.stringify({ active: false }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      active: true,
      id: p.id,
      name: p.name,
      slogan: p.slogan,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      minOrderAmount: p.min_order_amount,
      minSlots: p.min_slots,
      validFrom: p.valid_from,
      validUntil: p.valid_until,
    }),
  };
};
