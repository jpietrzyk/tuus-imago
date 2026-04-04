export type HubSpotConfig = {
  accessToken: string;
  apiBaseUrl: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  total_price: number | string;
  items_count: number;
  marketing_consent: boolean;
  created_at: string;
};

export type ContactProperties = {
  firstname?: string;
  lastname: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  lifecyclestage: string;
  tuus_imago_order_number?: string;
  tuus_imago_order_value?: number;
  tuus_imago_items_count?: number;
  tuus_imago_checkout_date?: string;
  tuus_imago_marketing_consent?: string;
  tuus_imago_order_status?: string;
};

export type HubSpotContactResponse = {
  id?: string;
  properties?: Record<string, string>;
  message?: string;
};

export function getHubSpotConfig(): HubSpotConfig {
  const accessToken = process.env.HS_PRIVATE_APP_ACCESS_TOKEN?.trim();
  const apiBaseUrl = process.env.HUBSPOT_API_BASE_URL?.trim() || "https://api.hubapi.com";

  if (!accessToken) {
    throw new Error("Missing HS_PRIVATE_APP_ACCESS_TOKEN in environment.");
  }

  return { accessToken, apiBaseUrl };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "Unknown" };
  }

  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  if (lastSpaceIndex === -1) {
    return { firstName: "", lastName: trimmed };
  }

  return {
    firstName: trimmed.substring(0, lastSpaceIndex),
    lastName: trimmed.substring(lastSpaceIndex + 1),
  };
}

export function buildContactProperties(order: OrderRow): ContactProperties {
  const { firstName, lastName } = splitName(order.customer_name);
  const numericTotal =
    typeof order.total_price === "string"
      ? Number.parseFloat(order.total_price)
      : order.total_price;

  const properties: ContactProperties = {
    lastname: lastName,
    email: order.customer_email,
    lifecyclestage: "lead",
    tuus_imago_order_number: order.order_number,
    tuus_imago_order_value: numericTotal,
    tuus_imago_items_count: order.items_count,
    tuus_imago_checkout_date: order.created_at,
    tuus_imago_marketing_consent: order.marketing_consent ? "true" : "false",
    tuus_imago_order_status: order.status,
  };

  if (firstName) {
    properties.firstname = firstName;
  }

  if (order.customer_phone?.trim()) {
    properties.phone = order.customer_phone.trim().substring(0, 30);
  }

  if (order.shipping_address?.trim()) {
    properties.address = order.shipping_address.trim();
  }

  if (order.shipping_city?.trim()) {
    properties.city = order.shipping_city.trim();
  }

  if (order.shipping_postal_code?.trim()) {
    properties.zip = order.shipping_postal_code.trim();
  }

  if (order.shipping_country?.trim()) {
    properties.country = order.shipping_country.trim();
  }

  return properties;
}

export async function upsertHubSpotContact(
  config: HubSpotConfig,
  properties: ContactProperties,
): Promise<HubSpotContactResponse> {
  const url = `${config.apiBaseUrl}/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `HubSpot contact upsert failed (status ${response.status}): ${text.substring(0, 500)}`,
    );
  }

  return response.json() as Promise<HubSpotContactResponse>;
}
