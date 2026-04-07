import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/export-user-data";
import {
  createSelectEqMaybeSingle,
  mockSupabaseClient,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function buildAuthClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "jane@example.com", created_at: "2026-01-01" } },
        error: null,
      }),
    },
  };
}

describe("export-user-data handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "pk_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  });

  it("returns 401 when no authorization header", async () => {
    const response = await handler({ httpMethod: "GET", body: null });
    expect(response.statusCode).toBe(401);
  });

  it("returns 405 for POST requests", async () => {
    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer token-123" },
    });
    expect(response.statusCode).toBe(405);
  });

  it("exports user profile, addresses, and orders as JSON", async () => {
    const authClient = buildAuthClient();

    const { select: profileSelect } = createSelectEqMaybeSingle({
      data: { id: "user-1", full_name: "Jane Doe", phone: "+48123" },
      error: null,
    });

    const orderData = [
      { id: "order-1", order_number: "TI-2026-000001", status: "paid" },
    ];

    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "user-1", full_name: "Jane Doe", phone: "+48123" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const profileSelectFn = vi.fn().mockReturnValue({ eq });

    const addressEq = vi.fn().mockResolvedValue({ data: [{ id: "addr-1", city: "Warsaw" }], error: null });
    const addressSelect = vi.fn().mockReturnValue({ eq: addressEq });

    const orderEq = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: orderData, error: null }) });
    const orderSelect = vi.fn().mockReturnValue({ eq: orderEq });

    const itemIn = vi.fn().mockResolvedValue({ data: [{ id: "item-1", order_id: "order-1" }], error: null });
    const itemSelect = vi.fn().mockReturnValue({ in: itemIn });

    const from = vi.fn((table: string) => {
      switch (table) {
        case "profiles": return { select: profileSelectFn };
        case "addresses": return { select: addressSelect };
        case "orders": return { select: orderSelect };
        case "order_items": return { select: itemSelect };
        default: throw new Error(`Unexpected table: ${table}`);
      }
    });

    createClientMock
      .mockReturnValueOnce(authClient as never)
      .mockReturnValueOnce({ from } as never);

    const response = await handler({
      httpMethod: "GET",
      headers: { authorization: "Bearer token-123" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.id).toBe("user-1");
    expect(body.user.email).toBe("jane@example.com");
    expect(body.profile).toEqual({ id: "user-1", full_name: "Jane Doe", phone: "+48123" });
    expect(body.addresses).toEqual([{ id: "addr-1", city: "Warsaw" }]);
    expect(body.orders).toEqual(orderData);
    expect(body.orderItems).toEqual([{ id: "item-1", order_id: "order-1" }]);
    expect(body.exportedAt).toBeDefined();
  });

  it("returns data even when user has no orders", async () => {
    const authClient = buildAuthClient();

    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "user-1", full_name: "Jane" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const profileSelectFn = vi.fn().mockReturnValue({ eq });

    const addressEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const addressSelect = vi.fn().mockReturnValue({ eq: addressEq });

    const orderEq = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const orderSelect = vi.fn().mockReturnValue({ eq: orderEq });

    const from = vi.fn((table: string) => {
      switch (table) {
        case "profiles": return { select: profileSelectFn };
        case "addresses": return { select: addressSelect };
        case "orders": return { select: orderSelect };
        default: throw new Error(`Unexpected table: ${table}`);
      }
    });

    createClientMock
      .mockReturnValueOnce(authClient as never)
      .mockReturnValueOnce({ from } as never);

    const response = await handler({
      httpMethod: "GET",
      headers: { authorization: "Bearer token-123" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.orders).toEqual([]);
    expect(body.orderItems).toEqual([]);
  });
});
