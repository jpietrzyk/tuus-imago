import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/available-frames";
import { createServiceClient } from "../functions/_shared/supabase-auth";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function setupFramesQuery(result: unknown) {
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

describe("available-frames handler", () => {
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

  it("returns 500 with empty frames when client init fails", async () => {
    mockCreateServiceClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.frames).toEqual([]);
  });

  it("returns empty frames list when none exist", async () => {
    setupSupabaseMock({
      picture_frames: setupFramesQuery({ data: [], error: null }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.frames).toEqual([]);
  });

  it("returns 500 with empty frames when query fails", async () => {
    setupSupabaseMock({
      picture_frames: setupFramesQuery({
        data: null,
        error: { message: "DB error" },
      }),
    });

    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.frames).toEqual([]);
  });

  it("returns active frames with camelCase mapping", async () => {
    setupSupabaseMock({
      picture_frames: setupFramesQuery({
        data: [
          {
            id: "frame-1",
            name: "Oak Classic",
            description: "Solid oak",
            price: "49.00",
            currency: "PLN",
            image_url: "https://example.com/oak.jpg",
            color: "#c8a165",
            material: "oak wood",
            is_default: true,
            sort_order: 0,
          },
          {
            id: "frame-2",
            name: "Black Metal",
            description: null,
            price: 35,
            currency: "PLN",
            image_url: null,
            color: "#111111",
            material: "aluminium",
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
    expect(body.frames).toHaveLength(2);
    expect(body.frames[0]).toEqual({
      id: "frame-1",
      name: "Oak Classic",
      description: "Solid oak",
      price: 49,
      currency: "PLN",
      imageUrl: "https://example.com/oak.jpg",
      color: "#c8a165",
      material: "oak wood",
      isDefault: true,
    });
    expect(body.frames[1]).toEqual({
      id: "frame-2",
      name: "Black Metal",
      description: null,
      price: 35,
      currency: "PLN",
      imageUrl: null,
      color: "#111111",
      material: "aluminium",
      isDefault: false,
    });
  });
});
