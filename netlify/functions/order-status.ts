import { createClient } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  queryStringParameters?: Record<string, string | undefined>;
};

type OrderStatusRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_session_id: string | null;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "GET") {
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
      body: JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment." }),
    };
  }

  const orderId = event.queryStringParameters?.["orderId"]?.trim();

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing orderId." }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_session_id")
    .eq("id", orderId)
    .maybeSingle<OrderStatusRow>();

  if (error || !order) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Order not found." }),
    };
  }

  if (!order.payment_session_id) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Order is not eligible for status polling." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: order.status,
      payment_status: order.payment_status,
      order_number: order.order_number,
    }),
  };
};
