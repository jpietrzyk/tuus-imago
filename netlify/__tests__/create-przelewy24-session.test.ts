import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/create-przelewy24-session";
import {
  createSelectEqMaybeSingle,
  createUpdateEq,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("create-przelewy24-session handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.P24_MERCHANT_ID = "12345";
    process.env.P24_POS_ID = "12345";
    process.env.P24_CRC = "crc-key";
    process.env.P24_API_KEY = "api-key";
    process.env.P24_API_BASE_URL = "https://sandbox.przelewy24.pl/api/v1";
    process.env.SITE_URL = "https://tuusimago.test";
    delete process.env.P24_STATUS_URL;
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.P24_MERCHANT_ID;
    delete process.env.P24_POS_ID;
    delete process.env.P24_CRC;
    delete process.env.P24_API_KEY;
    delete process.env.P24_API_BASE_URL;
    delete process.env.SITE_URL;
    delete process.env.P24_STATUS_URL;
    vi.unstubAllGlobals();
  });

  it("returns an existing redirect URL when payment was already registered", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        customer_phone: null,
        shipping_address: "Main 1",
        shipping_city: "Warsaw",
        shipping_postal_code: "00-001",
        shipping_country: "PL",
        currency: "PLN",
        total_price: 200,
        shipping_cost: 14.99,
        payment_session_id: "order-order-1",
        payment_token: "existing-token",
        payment_status: "registered",
      },
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1" }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<Record<string, string>>(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      paymentSessionId: "order-order-1",
      redirectUrl: "https://sandbox.przelewy24.pl/trnRequest/existing-token",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("registers a new Przelewy24 transaction and persists payment session details", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        customer_phone: "48123456789",
        shipping_address: "Main 1",
        shipping_city: "Warsaw",
        shipping_postal_code: "00-001",
        shipping_country: "PL",
        currency: "PLN",
        total_price: 200,
        shipping_cost: 14.99,
        payment_session_id: null,
        payment_token: null,
        payment_status: "pending",
      },
      error: null,
    });
    const { update } = createUpdateEq();
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
        update,
      },
      order_status_history: {
        insert: historyInsert,
      },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { token: "new-token" }, responseCode: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1", language: "en" }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<Record<string, string>>(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      paymentSessionId: "order-order-1",
      redirectUrl: "https://sandbox.przelewy24.pl/trnRequest/new-token",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://sandbox.przelewy24.pl/api/v1/transaction/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_provider: "przelewy24",
        payment_status: "registered",
        payment_session_id: "order-order-1",
        payment_token: "new-token",
        payment_error: null,
      }),
    );
    expect(historyInsert).toHaveBeenCalledWith({
      order_id: "order-1",
      status_type: "payment",
      status: "registered",
      note: "Przelewy24 transaction registered.",
    });
  });

  it("rejects already paid orders", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "paid",
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        customer_phone: null,
        shipping_address: "Main 1",
        shipping_city: "Warsaw",
        shipping_postal_code: "00-001",
        shipping_country: "PL",
        currency: "PLN",
        total_price: 200,
        shipping_cost: 14.99,
        payment_session_id: null,
        payment_token: null,
        payment_status: "verified",
      },
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1" }),
    });

    expect(response.statusCode).toBe(409);
    expect(readBody<{ error: string }>(response)).toEqual({
      error: "Order is already paid.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
