import { type UploadedSlotResult } from "@/components/image-uploader";
import { supabase } from "@/lib/supabase-client";

export interface CheckoutCustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}

export type UploadedCheckoutSlot = UploadedSlotResult & {
  transformedUrl: string;
};

export interface CreateOrderRequest {
  customer: CheckoutCustomerInput;
  uploadedSlots: UploadedCheckoutSlot[];
  idempotencyKey: string;
  couponCode?: string;
  userId?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
}

type ErrorResponse = {
  error?: string;
};

export interface CreateP24SessionResponse {
  orderId: string;
  orderNumber: string;
  paymentSessionId: string;
  redirectUrl: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  reason?: string;
  couponId?: string;
  code?: string;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  discountAmount?: number;
}

export interface CustomerOrder {
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
  items: CustomerOrderItem[];
}

export interface CustomerOrderItem {
  id: string;
  slot_key: string;
  slot_index: number;
  transformed_url: string;
  transformations: Record<string, unknown>;
  ai_adjustments: Record<string, unknown> | null;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  return data;
}

export async function createOrder(
  payload: CreateOrderRequest,
  signal?: AbortSignal,
): Promise<CreateOrderResponse> {
  const response = await fetch("/.netlify/functions/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await parseJsonResponse<CreateOrderResponse | ErrorResponse>(
    response,
  );

  if (!response.ok || "error" in data) {
    throw new Error((data as ErrorResponse).error ?? "Could not create order.");
  }

  return data as CreateOrderResponse;
}

export async function syncHubSpotContact(orderId: string): Promise<void> {
  try {
    await fetch("/.netlify/functions/sync-hubspot-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    // Non-blocking — HubSpot failure must not affect checkout
  }
}

export async function createP24Session(
  payload: { orderId: string; language?: string },
  signal?: AbortSignal,
): Promise<CreateP24SessionResponse> {
  const response = await fetch(
    "/.netlify/functions/create-przelewy24-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    },
  );

  const data = await parseJsonResponse<
    CreateP24SessionResponse | ErrorResponse
  >(response);

  if (!response.ok || "error" in data) {
    throw new Error(
      (data as ErrorResponse).error ?? "Could not create payment session.",
    );
  }

  return data as CreateP24SessionResponse;
}

export async function validateCoupon(
  code: string,
  orderTotal: number,
): Promise<ValidateCouponResponse> {
  const response = await fetch("/.netlify/functions/validate-coupon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, orderTotal }),
  });

  return parseJsonResponse<ValidateCouponResponse>(response);
}

export async function getCustomerOrders(
  orderId?: string,
): Promise<{ orders: CustomerOrder[] } | { order: CustomerOrder }> {
  const headers = await getAuthHeaders();
  const url = orderId
    ? `/.netlify/functions/customer-orders?orderId=${encodeURIComponent(orderId)}`
    : "/.netlify/functions/customer-orders";

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not fetch orders.");
  }

  return parseJsonResponse<{ orders: CustomerOrder[] } | { order: CustomerOrder }>(response);
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const headers = await getAuthHeaders();

  const response = await fetch("/.netlify/functions/customer-addresses", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not fetch addresses.");
  }

  const data = await parseJsonResponse<{ addresses: CustomerAddress[] }>(response);
  return data.addresses;
}

export async function createCustomerAddress(
  address: Omit<CustomerAddress, "id" | "user_id" | "created_at" | "updated_at">,
): Promise<CustomerAddress> {
  const headers = await getAuthHeaders();

  const response = await fetch("/.netlify/functions/customer-addresses", {
    method: "POST",
    headers,
    body: JSON.stringify(address),
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not create address.");
  }

  const data = await parseJsonResponse<{ address: CustomerAddress }>(response);
  return data.address;
}

export async function updateCustomerAddress(
  addressId: string,
  updates: Partial<Omit<CustomerAddress, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<CustomerAddress> {
  const headers = await getAuthHeaders();

  const response = await fetch("/.netlify/functions/customer-addresses", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ id: addressId, ...updates }),
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not update address.");
  }

  const data = await parseJsonResponse<{ address: CustomerAddress }>(response);
  return data.address;
}

export async function deleteCustomerAddress(
  addressId: string,
): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `/.netlify/functions/customer-addresses?id=${encodeURIComponent(addressId)}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not delete address.");
  }
}

export async function deleteAccount(signal?: AbortSignal): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch("/.netlify/functions/delete-account", {
    method: "POST",
    headers,
    signal,
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not delete account.");
  }
}

export async function exportUserData(signal?: AbortSignal): Promise<Blob> {
  const headers = await getAuthHeaders();
  const response = await fetch("/.netlify/functions/export-user-data", {
    method: "GET",
    headers,
    signal,
  });

  if (!response.ok) {
    const data = await parseJsonResponse<ErrorResponse>(response);
    throw new Error(data.error ?? "Could not export data.");
  }

  return response.blob();
}
