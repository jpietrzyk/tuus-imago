import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/active-promotion";
import { createServiceClient } from "../functions/_shared/supabase-auth";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function createSelectEqMaybeSingle<T>(result: T) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });

  return { select, eq, maybeSingle };
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

describe("active-promotion handler", () => {
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

  it("returns active false when no promotion exists", async () => {
    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: null, error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.active).toBe(false);
  });

  it("returns active false when fetch error occurs", async () => {
    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: null, error: { message: "DB error" } }),
    });

    const response = await handler({ httpMethod: "GET" });
    const body = JSON.parse(response.body);
    expect(body.active).toBe(false);
  });

  it("returns promotion when one is active", async () => {
    const promotion = {
      id: "promo-1",
      name: "Spring Sale",
      slogan: "Spring Sale -20%!",
      discount_type: "percentage",
      discount_value: 20,
      currency: "PLN",
      min_order_amount: null,
      min_slots: null,
      valid_from: null,
      valid_until: null,
      is_active: true,
    };

    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: promotion, error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.active).toBe(true);
    expect(body.id).toBe("promo-1");
    expect(body.name).toBe("Spring Sale");
    expect(body.slogan).toBe("Spring Sale -20%!");
    expect(body.discountType).toBe("percentage");
    expect(body.discountValue).toBe(20);
  });

  it("returns active false when promotion valid_from is in the future", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const promotion = {
      id: "promo-1",
      name: "Future Sale",
      slogan: "Future Sale",
      discount_type: "percentage",
      discount_value: 10,
      currency: "PLN",
      min_order_amount: null,
      min_slots: null,
      valid_from: future,
      valid_until: null,
      is_active: true,
    };

    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: promotion, error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    const body = JSON.parse(response.body);
    expect(body.active).toBe(false);
  });

  it("returns active false when promotion valid_until is in the past", async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const promotion = {
      id: "promo-1",
      name: "Expired Sale",
      slogan: "Expired Sale",
      discount_type: "percentage",
      discount_value: 10,
      currency: "PLN",
      min_order_amount: null,
      min_slots: null,
      valid_from: null,
      valid_until: past,
      is_active: true,
    };

    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: promotion, error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    const body = JSON.parse(response.body);
    expect(body.active).toBe(false);
  });

  it("returns promotion with conditions when active and valid", async () => {
    const promotion = {
      id: "promo-2",
      name: "Bulk Discount",
      slogan: "Buy more save more!",
      discount_type: "fixed_amount",
      discount_value: 50,
      currency: "PLN",
      min_order_amount: 400,
      min_slots: 2,
      valid_from: null,
      valid_until: null,
      is_active: true,
    };

    setupSupabaseMock({
      promotions: createSelectEqMaybeSingle({ data: promotion, error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    const body = JSON.parse(response.body);
    expect(body.active).toBe(true);
    expect(body.discountType).toBe("fixed_amount");
    expect(body.discountValue).toBe(50);
    expect(body.minOrderAmount).toBe(400);
    expect(body.minSlots).toBe(2);
  });
});
