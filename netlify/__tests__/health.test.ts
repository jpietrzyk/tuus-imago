import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler, resetHealthProbeCache } from "../functions/health";
import { createServiceClient } from "../functions/_shared/supabase-auth";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function mockDatabase(result: unknown) {
  const limit = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });
  mockCreateServiceClient.mockReturnValue({ from } as never);
  return { from, select, limit };
}

describe("health handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHealthProbeCache();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns 200 ok when the database probe succeeds", async () => {
    mockDatabase({ data: [{ key: "dpi_guard" }], error: null });

    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      status: "ok",
      checks: { database: { status: "ok" } },
    });
  });

  it("never caches the probe and reports the running version", async () => {
    mockDatabase({ data: [], error: null });

    const response = await handler({ httpMethod: "GET" });

    expect(response.headers?.["Cache-Control"]).toBe("no-store");
    expect(response.headers?.["Content-Type"]).toBe("application/json");
    expect(typeof JSON.parse(response.body).version).toBe("string");
  });

  it("returns 503 degraded when the database query errors", async () => {
    mockDatabase({ data: null, error: { message: "relation does not exist" } });

    const response = await handler({ httpMethod: "GET" });
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("error");
    // Raw driver errors must not reach the public response.
    expect(response.body).not.toContain("relation does not exist");
  });

  it("returns 503 degraded when the service client cannot be created", async () => {
    mockCreateServiceClient.mockImplementation(() => {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
    });

    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body).status).toBe("degraded");
  });

  it("returns 503 when the database probe hangs past the timeout", async () => {
    vi.useFakeTimers();
    const limit = vi.fn().mockReturnValue(new Promise(() => {}));
    const select = vi.fn().mockReturnValue({ limit });
    mockCreateServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ select }),
    } as never);

    const pending = handler({ httpMethod: "GET" });
    await vi.advanceTimersByTimeAsync(5000);
    const response = await pending;

    expect(JSON.parse(response.body).checks.database.status).toBe("error");
    expect(response.statusCode).toBe(503);
  });

  it("memoizes the probe so bursts cannot add database load", async () => {
    const { from } = mockDatabase({ data: [], error: null });

    await handler({ httpMethod: "GET" });
    await handler({ httpMethod: "GET" });

    expect(from).toHaveBeenCalledTimes(1);
  });

  it("treats a missing method as GET", async () => {
    mockDatabase({ data: [], error: null });

    const response = await handler({});

    expect(response.statusCode).toBe(200);
  });

  it("answers HEAD without a body", async () => {
    mockDatabase({ data: [], error: null });

    const response = await handler({ httpMethod: "HEAD" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("");
  });

  it("returns 405 for unsupported methods without touching the database", async () => {
    const response = await handler({ httpMethod: "POST" });

    expect(response.statusCode).toBe(405);
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
  });
});
