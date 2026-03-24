import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "./admin-shipment-options";
import {
  createSelectEqMaybeSingle,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("admin-shipment-options handler", () => {
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

  it("requires an orderId query parameter", async () => {
    const response = await handler({
      httpMethod: "GET",
      headers: { "x-admin-token": "admin-token" },
      queryStringParameters: {},
    });

    expect(response.statusCode).toBe(400);
    expect(readBody(response)).toEqual({
      error: "Missing orderId query parameter.",
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the order does not exist", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: null,
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
      },
    });

    const response = await handler({
      httpMethod: "GET",
      headers: { "x-admin-token": "admin-token" },
      queryStringParameters: { orderId: "order-missing" },
    });

    expect(response.statusCode).toBe(404);
    expect(readBody(response)).toEqual({ error: "Order not found." });
  });

  it("returns current shipment details and allowed next statuses", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        shipment_status: "in_transit",
        tracking_number: "TRACK-123",
      },
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        select,
      },
    });

    const response = await handler({
      httpMethod: "GET",
      headers: { "x-admin-token": "admin-token" },
      queryStringParameters: { orderId: "order-1" },
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      currentShipmentStatus: "in_transit",
      trackingNumber: "TRACK-123",
      allowedNextShipmentStatuses: ["delivered", "failed_delivery", "returned"],
      allShipmentStatuses: [
        "pending_fulfillment",
        "in_transit",
        "delivered",
        "failed_delivery",
        "returned",
      ],
    });
  });
});
