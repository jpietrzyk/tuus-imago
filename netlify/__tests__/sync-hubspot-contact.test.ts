import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/sync-hubspot-contact";
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

const SAMPLE_ORDER = {
  id: "order-1",
  order_number: "TI-2026-000001",
  status: "pending_payment",
  customer_name: "Jan Kowalski",
  customer_email: "jan@example.com",
  customer_phone: "48123456789",
  shipping_address: "Main 1",
  shipping_city: "Warsaw",
  shipping_postal_code: "00-001",
  shipping_country: "PL",
  total_price: 200,
  items_count: 2,
  marketing_consent: true,
  created_at: "2026-04-04T12:00:00Z",
};

describe("sync-hubspot-contact handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.HS_PRIVATE_APP_ACCESS_TOKEN = "pat-test-token-123";
    process.env.HUBSPOT_API_BASE_URL = "https://api.hubapi.com";
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());

    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      if (urlStr.includes("/crm/v3/objects/contacts/")) {
        return new Response(
          JSON.stringify({ id: "hubspot-contact-001", properties: { email: "jan@example.com" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not Found", { status: 404 });
    });
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.HS_PRIVATE_APP_ACCESS_TOKEN;
    delete process.env.HUBSPOT_API_BASE_URL;
    vi.unstubAllGlobals();
  });

  it("successfully syncs a contact and updates the order", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: SAMPLE_ORDER,
      error: null,
    });
    const { update } = createUpdateEq();
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseClient(createClientMock, {
      orders: { select, update },
      order_status_history: { insert: historyInsert },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1" }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ synced: boolean }>(response).synced).toBe(true);
    expect(readBody<{ contactId: string }>(response).contactId).toBe("hubspot-contact-001");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        hubspot_contact_id: "hubspot-contact-001",
        hubspot_synced_at: expect.any(String),
      }),
    );
    expect(historyInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        status_type: "crm",
        status: "hubspot_synced",
      }),
    );
  });

  it("returns 404 when order is not found", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: null,
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: { select },
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "nonexistent" }),
    });

    expect(response.statusCode).toBe(404);
    expect(readBody<{ error: string }>(response).error).toBe("Order not found.");
  });

  it("returns 200 even when HubSpot API fails (non-blocking)", async () => {
    const { select } = createSelectEqMaybeSingle({
      data: SAMPLE_ORDER,
      error: null,
    });

    mockSupabaseClient(createClientMock, {
      orders: { select },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1" }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ synced: boolean }>(response).synced).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[sync-hubspot-contact]"),
      expect.any(String),
    );

    consoleErrorSpy.mockRestore();
  });

  it("returns 200 when HubSpot is not configured", async () => {
    delete process.env.HS_PRIVATE_APP_ACCESS_TOKEN;

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ orderId: "order-1" }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ synced: boolean }>(response).synced).toBe(false);
  });

  it("rejects non-POST methods", async () => {
    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(405);
  });

  it("rejects missing orderId", async () => {
    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({}),
    });

    expect(response.statusCode).toBe(400);
    expect(readBody<{ error: string }>(response).error).toBe("Missing orderId.");
  });
});
