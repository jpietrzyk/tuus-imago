import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/debug-orders";
import {
  createSelectInOrder,
  createSelectOrderLimit,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("debug-orders handler", () => {
  beforeEach(() => {
    process.env.DEBUG_ORDERS_ENABLED = "true";
    process.env.DEBUG_ORDERS_TOKEN = "debug-token";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.DEBUG_ORDERS_ENABLED;
    delete process.env.DEBUG_ORDERS_TOKEN;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("returns 404 when debug access is disabled", async () => {
    process.env.DEBUG_ORDERS_ENABLED = "false";

    const response = await handler({
      httpMethod: "GET",
      headers: { "x-debug-token": "debug-token" },
      queryStringParameters: {},
    });

    expect(response.statusCode).toBe(404);
    expect(readBody(response)).toEqual({ error: "Not Found" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rejects unauthorized requests", async () => {
    const response = await handler({
      httpMethod: "GET",
      headers: {},
      queryStringParameters: {},
    });

    expect(response.statusCode).toBe(401);
    expect(readBody(response)).toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns recent orders with grouped items and history", async () => {
    const { select: ordersSelect } = createSelectOrderLimit({
      data: [
        {
          id: "order-1",
          order_number: "TI-2026-000001",
          status: "pending_payment",
          shipment_status: "pending_fulfillment",
          shipping_method: "inpost_courier",
          shipping_cost: 14.99,
          tracking_number: null,
          customer_email: "jane@example.com",
          currency: "PLN",
          total_price: 200,
          items_count: 1,
          created_at: "2026-03-25T00:00:00Z",
        },
      ],
      error: null,
    });
    const { select: itemsSelect } = createSelectInOrder({
      data: [
        {
          order_id: "order-1",
          slot_index: 0,
          slot_key: "left",
          transformed_url: "https://example.com/image.jpg",
          created_at: "2026-03-25T00:01:00Z",
        },
      ],
      error: null,
    });
    const { select: historySelect } = createSelectInOrder({
      data: [
        {
          order_id: "order-1",
          status_type: "order",
          status: "pending_payment",
          note: "Order created.",
          created_at: "2026-03-25T00:02:00Z",
        },
      ],
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select: ordersSelect,
      },
      order_items: {
        select: itemsSelect,
      },
      order_status_history: {
        select: historySelect,
      },
    });

    const response = await handler({
      httpMethod: "GET",
      headers: { "x-debug-token": "debug-token" },
      queryStringParameters: { limit: "999" },
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      meta: {
        debug: true,
        limit: 50,
        count: 1,
      },
      data: [
        {
          id: "order-1",
          order_number: "TI-2026-000001",
          status: "pending_payment",
          shipment_status: "pending_fulfillment",
          shipping_method: "inpost_courier",
          shipping_cost: 14.99,
          tracking_number: null,
          customer_email: "jane@example.com",
          currency: "PLN",
          total_price: 200,
          items_count: 1,
          created_at: "2026-03-25T00:00:00Z",
          items: [
            {
              order_id: "order-1",
              slot_index: 0,
              slot_key: "left",
              transformed_url: "https://example.com/image.jpg",
              created_at: "2026-03-25T00:01:00Z",
            },
          ],
          history: [
            {
              order_id: "order-1",
              status_type: "order",
              status: "pending_payment",
              note: "Order created.",
              created_at: "2026-03-25T00:02:00Z",
            },
          ],
        },
      ],
    });
  });
});
