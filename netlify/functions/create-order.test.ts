import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "./create-order";
import {
  createDeleteEq,
  createInsertSelectSingle,
  createSelectEqMaybeSingle,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function buildCustomer() {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    address: "Main 1",
    city: "Warsaw",
    postalCode: "00-001",
    country: "PL",
    termsAccepted: true,
    privacyAccepted: true,
    marketingConsent: false,
  };
}

describe("create-order handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("returns 400 when idempotency key is missing", async () => {
    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
        },
        uploadedSlots: [],
      }),
    });

    expect(response.statusCode).toBe(400);
    expect(readBody(response)).toEqual({ error: "Missing idempotency key." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("creates an order, items, and initial history", async () => {
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: vi.fn(),
      },
      order_items: {
        insert: orderItemsInsert,
      },
      order_status_history: {
        insert: historyInsert,
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "123456789",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: true,
        },
        idempotencyKey: "checkout-submit-1",
        uploadedSlots: [
          {
            slotIndex: 0,
            slotKey: "left",
            transformedUrl: "https://example.com/image.jpg",
            publicId: "public-1",
            secureUrl: "https://example.com/secure-image.jpg",
            transformations: {
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
              brightness: 0,
              contrast: 0,
              grayscale: 0,
              blur: 0,
            },
            aiAdjustments: {
              enhance: true,
              removeBackground: false,
              upscale: false,
              restore: false,
            },
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      status: "pending_payment",
    });
    expect(orderInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        idempotency_key: "checkout-submit-1",
        shipping_method: "inpost_courier",
        shipment_status: "pending_fulfillment",
        items_count: 1,
      }),
    );
    expect(orderItemsInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: "order-1",
        slot_key: "left",
        transformed_url: "https://example.com/image.jpg",
      }),
    ]);
    expect(historyInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: "order-1",
        status_type: "order",
        status: "pending_payment",
      }),
      expect.objectContaining({
        order_id: "order-1",
        status_type: "shipment",
        status: "pending_fulfillment",
      }),
    ]);
  });

  it("returns the existing order for an idempotent retry", async () => {
    const { select: ordersSelect, eq } = createSelectEqMaybeSingle({
      data: {
        id: "order-existing",
        order_number: "TI-2026-000123",
        status: "pending_payment",
      },
      error: null,
    });
    const { insert: orderInsert } = createInsertSelectSingle({
      data: null,
      error: { code: "23505" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: ordersSelect,
        delete: vi.fn(),
      },
      order_items: {
        insert: vi.fn(),
      },
      order_status_history: {
        insert: vi.fn(),
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
        },
        uploadedSlots: [],
        idempotencyKey: "checkout-submit-1",
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-existing",
      orderNumber: "TI-2026-000123",
      status: "pending_payment",
    });
    expect(ordersSelect).toHaveBeenCalledWith("id, order_number, status");
    expect(eq).toHaveBeenCalledWith("idempotency_key", "checkout-submit-1");
  });

  it("deletes the order when item persistence fails", async () => {
    const { delete: orderDelete, eq: rollbackEq } = createDeleteEq();
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const orderItemsInsert = vi.fn().mockResolvedValue({
      error: { message: "insert failed" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: orderDelete,
      },
      order_items: {
        insert: orderItemsInsert,
      },
      order_status_history: {
        insert: vi.fn(),
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: buildCustomer(),
        idempotencyKey: "checkout-submit-rollback-items",
        uploadedSlots: [
          {
            slotIndex: 0,
            slotKey: "left",
            transformedUrl: "https://example.com/image.jpg",
            transformations: {
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
              brightness: 0,
              contrast: 0,
              grayscale: 0,
              blur: 0,
            },
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(500);
    expect(readBody(response)).toEqual({ error: "Could not persist order items." });
    expect(orderDelete).toHaveBeenCalled();
    expect(rollbackEq).toHaveBeenCalledWith("id", "order-1");
  });

  it("deletes the order when history persistence fails", async () => {
    const { delete: orderDelete, eq: rollbackEq } = createDeleteEq();
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const historyInsert = vi.fn().mockResolvedValue({
      error: { message: "history insert failed" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: orderDelete,
      },
      order_items: {
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
      order_status_history: {
        insert: historyInsert,
      },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: buildCustomer(),
        idempotencyKey: "checkout-submit-rollback-history",
        uploadedSlots: [],
      }),
    });

    expect(response.statusCode).toBe(500);
    expect(readBody(response)).toEqual({
      error: "Could not persist order status history.",
    });
    expect(orderDelete).toHaveBeenCalled();
    expect(rollbackEq).toHaveBeenCalledWith("id", "order-1");
    expect(historyInsert).toHaveBeenCalled();
  });
});
