import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "./przelewy24-webhook";
import {
  buildNotificationSign,
  buildVerifySign,
} from "./_shared/przelewy24";
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

function buildNotification(overrides: Partial<Record<string, unknown>> = {}) {
  const payload = {
    merchantId: 12345,
    posId: 12345,
    sessionId: "order-order-1",
    amount: 20000,
    originAmount: 20000,
    currency: "PLN",
    orderId: 987654321,
    methodId: 266,
    statement: "P24-TI-2026-000001",
    ...overrides,
  } as const;

  return {
    ...payload,
    sign: buildNotificationSign({
      merchantId: payload.merchantId,
      posId: payload.posId,
      sessionId: payload.sessionId,
      amount: payload.amount,
      originAmount: payload.originAmount,
      currency: payload.currency,
      orderId: payload.orderId,
      methodId: payload.methodId,
      statement: payload.statement,
      crc: "crc-key",
    }),
  };
}

describe("przelewy24-webhook handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.P24_MERCHANT_ID = "12345";
    process.env.P24_POS_ID = "12345";
    process.env.P24_CRC = "crc-key";
    process.env.P24_API_KEY = "api-key";
    process.env.P24_API_BASE_URL = "https://sandbox.przelewy24.pl/api/v1";
    process.env.SITE_URL = "https://tuusimago.test";
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
    vi.unstubAllGlobals();
  });

  it("rejects notifications with an invalid signature", async () => {
    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        ...buildNotification(),
        sign: "invalid-signature",
      }),
    });

    expect(response.statusCode).toBe(400);
    expect(readBody<{ error: string }>(response)).toEqual({
      error: "Invalid Przelewy24 notification signature.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns success immediately for a previously verified notification", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "paid",
        currency: "PLN",
        total_price: 200,
        payment_status: "verified",
        payment_order_id: 987654321,
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
      body: JSON.stringify(buildNotification()),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ status: string }>(response)).toEqual({
      status: "already_verified",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("verifies the transaction and marks the order as paid", async () => {
    const notification = buildNotification();
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
        currency: "PLN",
        total_price: 200,
        payment_status: "registered",
        payment_order_id: null,
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
      new Response(JSON.stringify({ data: { status: "success" }, responseCode: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify(notification),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ status: string }>(response)).toEqual({ status: "verified" });
    expect(fetch).toHaveBeenCalledWith(
      "https://sandbox.przelewy24.pl/api/v1/transaction/verify",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          merchantId: 12345,
          posId: 12345,
          sessionId: "order-order-1",
          amount: 20000,
          currency: "PLN",
          orderId: 987654321,
          sign: buildVerifySign({
            sessionId: "order-order-1",
            orderId: 987654321,
            amount: 20000,
            currency: "PLN",
            crc: "crc-key",
          }),
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        payment_provider: "przelewy24",
        payment_status: "verified",
        payment_order_id: 987654321,
        payment_method_id: 266,
        payment_error: null,
      }),
    );
    expect(historyInsert).toHaveBeenCalledWith([
      {
        order_id: "order-1",
        status_type: "payment",
        status: "verified",
        note: "Przelewy24 payment verified for P24 order 987654321.",
      },
      {
        order_id: "order-1",
        status_type: "order",
        status: "paid",
        note: "Order marked as paid after Przelewy24 verification.",
      },
    ]);
  });
});
