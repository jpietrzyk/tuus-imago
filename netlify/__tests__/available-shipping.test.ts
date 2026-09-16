import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/available-shipping";
import { createServiceClient } from "../functions/_shared/supabase-auth";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function setupShippingQuery(result: unknown) {
  const orderSecond = vi.fn().mockResolvedValue(result);
  const orderFirst = vi.fn().mockReturnValue({ order: orderSecond });
  const eq = vi.fn().mockReturnValue({ order: orderFirst });
  const select = vi.fn().mockReturnValue({ eq });

  return { select, eq, orderFirst, orderSecond };
}

function setupSupabaseMock(tables: Record<string, unknown>) {
  const from = vi.fn((table: string) => {
    if (!(table in tables)) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return tables[table] as never;
  });
  mockCreateServiceClient.mockReturnValue({ from } as never);
  return { from };
}

describe("available-shipping handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 405 for POST method", async () => {
    const response = await handler({ httpMethod: "POST" });
    expect(response.statusCode).toBe(405);
  });

  it("returns 500 with empty list when client init fails", async () => {
    mockCreateServiceClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.shippingMethods).toEqual([]);
  });

  it("returns empty list when none exist", async () => {
    setupSupabaseMock({
      shipping_methods: setupShippingQuery({ data: [], error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.shippingMethods).toEqual([]);
  });

  it("returns 500 with empty list when query fails", async () => {
    setupSupabaseMock({
      shipping_methods: setupShippingQuery({
        data: null,
        error: { message: "DB error" },
      }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.shippingMethods).toEqual([]);
  });

  it("returns active methods with camelCase mapping", async () => {
    setupSupabaseMock({
      shipping_methods: setupShippingQuery({
        data: [
          {
            id: "ship-1",
            name: "InPost Paczkomat",
            description: "Parcel locker",
            price: "12.50",
            currency: "PLN",
            delivery_time: "1-2 dni",
            free_shipping_threshold: "300.00",
            is_default: true,
            sort_order: 0,
          },
          {
            id: "ship-2",
            name: "DHL Express",
            description: null,
            price: 25,
            currency: "PLN",
            delivery_time: null,
            free_shipping_threshold: null,
            is_default: false,
            sort_order: 1,
          },
        ],
        error: null,
      }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.shippingMethods).toHaveLength(2);
    expect(body.shippingMethods[0]).toEqual({
      id: "ship-1",
      name: "InPost Paczkomat",
      description: "Parcel locker",
      price: 12.5,
      currency: "PLN",
      deliveryTime: "1-2 dni",
      freeShippingThreshold: 300,
      isDefault: true,
    });
    expect(body.shippingMethods[1]).toEqual({
      id: "ship-2",
      name: "DHL Express",
      description: null,
      price: 25,
      currency: "PLN",
      deliveryTime: null,
      freeShippingThreshold: null,
      isDefault: false,
    });
  });
});
