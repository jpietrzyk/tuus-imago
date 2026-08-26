import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/available-canvases";
import { createServiceClient } from "../functions/_shared/supabase-auth";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function setupCanvasesQuery(result: unknown) {
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

describe("available-canvases handler", () => {
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

  it("returns 500 with empty canvases when client init fails", async () => {
    mockCreateServiceClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.canvases).toEqual([]);
  });

  it("returns empty canvases list when none exist", async () => {
    setupSupabaseMock({
      picture_canvases: setupCanvasesQuery({ data: [], error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.canvases).toEqual([]);
  });

  it("returns 500 with empty canvases when query fails", async () => {
    setupSupabaseMock({
      picture_canvases: setupCanvasesQuery({
        data: null,
        error: { message: "DB error" },
      }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.canvases).toEqual([]);
  });

  it("returns active canvases with camelCase mapping", async () => {
    setupSupabaseMock({
      picture_canvases: setupCanvasesQuery({
        data: [
          {
            id: "canvas-1",
            name: "Classic Matte",
            description: "Matte cotton canvas",
            price: "39.00",
            currency: "PLN",
            image_url: "https://example.com/matte.jpg",
            color: "#f5f0e6",
            material: "cotton",
            is_default: true,
            sort_order: 0,
          },
          {
            id: "canvas-2",
            name: "Glossy Premium",
            description: null,
            price: 55,
            currency: "PLN",
            image_url: null,
            color: "#ffffff",
            material: "polyester",
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
    expect(body.canvases).toHaveLength(2);
    expect(body.canvases[0]).toEqual({
      id: "canvas-1",
      name: "Classic Matte",
      description: "Matte cotton canvas",
      price: 39,
      currency: "PLN",
      imageUrl: "https://example.com/matte.jpg",
      color: "#f5f0e6",
      material: "cotton",
      isDefault: true,
    });
    expect(body.canvases[1]).toEqual({
      id: "canvas-2",
      name: "Glossy Premium",
      description: null,
      price: 55,
      currency: "PLN",
      imageUrl: null,
      color: "#ffffff",
      material: "polyester",
      isDefault: false,
    });
  });
});
