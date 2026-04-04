import { type UploadedSlotResult } from "@/components/image-uploader";

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
