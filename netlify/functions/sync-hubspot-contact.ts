import { createClient } from "@supabase/supabase-js";
import {
  buildContactProperties,
  getHubSpotConfig,
  upsertHubSpotContact,
  type OrderRow,
} from "./_shared/hubspot";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

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

  let parsedBody: { orderId?: string };

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

  let config;

  try {
    config = getHubSpotConfig();
  } catch (error) {
    console.error("[sync-hubspot-contact] HubSpot config error:", error instanceof Error ? error.message : error);
    return {
      statusCode: 200,
      body: JSON.stringify({ synced: false, reason: "HubSpot not configured." }),
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
      "id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_postal_code, shipping_country, total_price, items_count, marketing_consent, created_at",
    )
    .eq("id", orderId)
    .maybeSingle<OrderRow>();

  if (orderError) {
    console.error("[sync-hubspot-contact] Order load error:", orderError.message);
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

  try {
    const contactProperties = buildContactProperties(order);
    const hubspotResponse = await upsertHubSpotContact(config, contactProperties);

    const contactId = hubspotResponse.id;
    const now = new Date().toISOString();

    const updateFields: Record<string, unknown> = {
      hubspot_synced_at: now,
    };

    if (contactId) {
      updateFields.hubspot_contact_id = contactId;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", order.id);

    if (updateError) {
      console.error("[sync-hubspot-contact] Could not update order with HubSpot contact ID:", updateError.message);
    }

    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        status_type: "crm",
        status: "hubspot_synced",
        note: `Contact synced to HubSpot CRM${contactId ? ` (ID: ${contactId})` : ""}.`,
      });

    if (historyError) {
      console.error("[sync-hubspot-contact] Could not write CRM history:", historyError.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ synced: true, contactId: contactId || null }),
    };
  } catch (error) {
    console.error(
      "[sync-hubspot-contact] HubSpot sync failed:",
      error instanceof Error ? error.message : error,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ synced: false, reason: "HubSpot sync failed." }),
    };
  }
};
