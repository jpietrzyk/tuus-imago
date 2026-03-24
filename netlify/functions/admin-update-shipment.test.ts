import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "./admin-update-shipment";
import {
  createSelectEqMaybeSingle,
  createUpdateEqSelectSingle,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("admin-update-shipment handler", () => {
  beforeEach(() => {
    process.env.ADMIN_SHIPMENT_TOKEN = "admin-token";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ADMIN_SHIPMENT_TOKEN;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("rejects unauthorized requests", async () => {
    const response = await handler({
      httpMethod: "POST",
      headers: {},
      body: JSON.stringify({
        orderId: "order-1",
        shipmentStatus: "in_transit",
      }),
    });

    expect(response.statusCode).toBe(401);
    expect(readBody(response)).toEqual({ error: "Unauthorized" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("blocks invalid shipment transitions", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        shipment_status: "pending_fulfillment",
      },
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
        update: vi.fn(),
      },
      order_status_history: {
        insert: vi.fn(),
      },
    });

    const response = await handler({
      httpMethod: "POST",
      headers: { "x-admin-token": "admin-token" },
      body: JSON.stringify({
        orderId: "order-1",
        shipmentStatus: "delivered",
      }),
    });

    expect(response.statusCode).toBe(409);
    expect(readBody(response)).toEqual({
      error:
        "Invalid shipment status transition from pending_fulfillment to delivered. Allowed next statuses: in_transit, failed_delivery, returned.",
    });
  });

  it("updates shipment details and appends history", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        shipment_status: "pending_fulfillment",
      },
      error: null,
    });
    const { update } = createUpdateEqSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        shipment_status: "in_transit",
        tracking_number: "TRACK-123",
      },
      error: null,
    });
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

    const response = await handler({
      httpMethod: "POST",
      headers: { "x-admin-token": "admin-token" },
      body: JSON.stringify({
        orderId: "order-1",
        shipmentStatus: "in_transit",
        trackingNumber: "  TRACK-123  ",
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      shipmentStatus: "in_transit",
      trackingNumber: "TRACK-123",
    });
    expect(update).toHaveBeenCalledWith({
      shipment_status: "in_transit",
      tracking_number: "TRACK-123",
    });
    expect(historyInsert).toHaveBeenCalledWith({
      order_id: "order-1",
      status_type: "shipment",
      status: "in_transit",
      note: "Shipment status changed from pending_fulfillment to in_transit.",
    });
  });
});
