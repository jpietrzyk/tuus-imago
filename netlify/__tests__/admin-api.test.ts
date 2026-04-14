import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/admin-api";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const ORIGINAL_FETCH = globalThis.fetch;

function mockFetchForAuth(user: { id: string; email: string }) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
    (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/auth/v1/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(user),
          text: () => Promise.resolve(JSON.stringify(user)),
        });
      }
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("not found") });
    },
  );
}

function mockFetchForAuthFailure() {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
    Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve("Unauthorized") }),
  );
}

function setupClient(
  tables: Record<string, Record<string, unknown>>,
  auth?: { admin?: { listUsers?: unknown } },
) {
  const from = vi.fn((table: string) => {
    if (!(table in tables)) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return tables[table] as never;
  });

  const client = {
    from,
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue(
          auth?.admin?.listUsers ?? { data: { users: [] }, error: null },
        ),
      },
    },
  };

  createClientMock.mockReturnValue(client as never);
  return { client, from };
}

function readBody(response: { body: string }) {
  return JSON.parse(response.body);
}

function makeAdminAuthCheck() {
  const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, single };
}

function makeNonAdminAuthCheck() {
  const single = vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, single };
}

function makeFailedAuthCheck() {
  const single = vi.fn().mockResolvedValue({ data: null, error: { message: "no profile" } });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, single };
}

describe("admin-api handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    globalThis.fetch = ORIGINAL_FETCH;
  });

  describe("authentication", () => {
    it("returns 401 when no authorization header", async () => {
      const response = await handler({ httpMethod: "GET", headers: {} });
      expect(response.statusCode).toBe(401);
      expect(readBody(response).error).toContain("Missing authorization token");
    });

    it("returns 401 when auth verification fails", async () => {
      mockFetchForAuthFailure();
      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer bad-token" },
        body: JSON.stringify({ resource: "partners" }),
      });
      expect(response.statusCode).toBe(401);
      expect(readBody(response).error).toContain("Invalid or expired token");
    });

    it("returns 403 when user is not admin", async () => {
      mockFetchForAuth({ id: "user-1", email: "user@test.com" });
      const authCheck = makeNonAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners" }),
      });

      expect(response.statusCode).toBe(403);
      expect(readBody(response).error).toContain("not an admin user");
    });

    it("returns 403 when profile query fails", async () => {
      mockFetchForAuth({ id: "user-1", email: "user@test.com" });
      const authCheck = makeFailedAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners" }),
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("resource validation", () => {
    it("returns 400 for invalid resource", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "invalid_table" }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Invalid resource");
    });
  });

  describe("GET", () => {
    it("returns single record by id", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "p1", company_name: "Test Partner" },
        error: null,
      });
      const eq = vi.fn().mockReturnValue({ maybeSingle });
      const select = vi.fn().mockReturnValue({ eq });

      setupClient({ profiles: authCheck, partners: { select } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: { resource: "partners", id: "p1" },
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data).toEqual({ id: "p1", company_name: "Test Partner" });
    });

    it("returns 404 when record not found", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq = vi.fn().mockReturnValue({ maybeSingle });
      const select = vi.fn().mockReturnValue({ eq });

      setupClient({ profiles: authCheck, partners: { select } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: { resource: "partners", id: "nonexistent" },
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns paginated list", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const range = vi.fn().mockResolvedValue({
        data: [{ id: "p1" }, { id: "p2" }],
        error: null,
        count: 2,
      });
      const order = vi.fn().mockReturnValue({ range });
      const select = vi.fn().mockReturnValue({ order });

      setupClient({ profiles: authCheck, partners: { select } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: {
          resource: "partners",
          pagination: JSON.stringify({ current: 1, pageSize: 25 }),
        },
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);
    });
  });

  describe("POST (create)", () => {
    it("creates a record and returns 201", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const single = vi.fn().mockResolvedValue({
        data: { id: "new-1", company_name: "New Partner" },
        error: null,
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });

      setupClient({ profiles: authCheck, partners: { insert } });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "partners",
          data: { company_name: "New Partner", is_active: true },
        }),
      });

      expect(response.statusCode).toBe(201);
      expect(readBody(response).data.company_name).toBe("New Partner");
      expect(insert).toHaveBeenCalledWith({ company_name: "New Partner", is_active: true });
    });

    it("returns 400 when data is missing", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners" }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing data payload");
    });
  });

  describe("PATCH (update)", () => {
    it("updates a record and returns 200", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const single = vi.fn().mockResolvedValue({
        data: { id: "p1", company_name: "Updated" },
        error: null,
      });
      const select = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ select });
      const update = vi.fn().mockReturnValue({ eq });

      setupClient({ profiles: authCheck, partners: { update } });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "partners",
          id: "p1",
          data: { company_name: "Updated" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data.company_name).toBe("Updated");
      expect(update).toHaveBeenCalledWith({ company_name: "Updated" });
    });

    it("returns 400 when id is missing", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners", data: { company_name: "Updated" } }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing record id");
    });

    it("returns 400 when data is missing", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners", id: "p1" }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing data payload");
    });

    it("toggles is_admin on a profile", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const single = vi.fn().mockResolvedValue({
        data: { id: "user-2", is_admin: true },
        error: null,
      });
      const select = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ select });
      const update = vi.fn().mockReturnValue({ eq });

      setupClient({ profiles: { ...authCheck, update } });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "profiles",
          id: "user-2",
          data: { is_admin: true },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(update).toHaveBeenCalledWith({ is_admin: true });
    });
  });

  describe("DELETE", () => {
    it("returns 400 when id is missing", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "DELETE",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "coupons" }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing record id");
    });

    it("deletes a record", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const eq = vi.fn().mockResolvedValue({ data: null, error: null });
      const deleteFn = vi.fn().mockReturnValue({ eq });

      setupClient({ profiles: authCheck, coupons: { delete: deleteFn } });

      const response = await handler({
        httpMethod: "DELETE",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "coupons", id: "c1" }),
      });

      expect(response.statusCode).toBe(200);
      expect(deleteFn).toHaveBeenCalled();
    });
  });

  describe("aggregation: user_list", () => {
    it("returns merged auth users and profiles", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const profilesData = [
        { id: "u1", full_name: "Alice", phone: "+48123", is_admin: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
        { id: "u2", full_name: "Bob", phone: null, is_admin: true, created_at: "2026-02-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z" },
      ];

      let profilesCallCount = 0;
      const { client } = setupClient(
        {},
        {
          admin: {
            listUsers: {
              data: {
                users: [
                  { id: "u1", email: "alice@test.com", created_at: "2026-01-01T00:00:00Z", last_sign_in_at: "2026-04-01T00:00:00Z" },
                  { id: "u2", email: "bob@test.com", created_at: "2026-02-01T00:00:00Z", last_sign_in_at: null },
                ],
              },
              error: null,
            },
          },
        },
      );

      const fromSpy = client.from;
      fromSpy.mockImplementation((table: string) => {
        if (table === "profiles") {
          profilesCallCount++;
          if (profilesCallCount === 1) {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          // Second call: full profile data fetch in handleUserList
          return { select: vi.fn().mockResolvedValue({ data: profilesData, error: null }) } as never;
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "user_list" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).toMatchObject({
        email: "bob@test.com",
        full_name: "Bob",
        is_admin: true,
      });
      expect(body.data[1]).toMatchObject({
        email: "alice@test.com",
        full_name: "Alice",
        is_admin: false,
      });
    });
  });

  describe("aggregation: partner_stats (single)", () => {
    it("returns stats for a single partner including referral orders", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const couponsData = [
        { id: "c1", code: "PARTNER10", discount_type: "percentage", discount_value: 10, used_count: 3, is_active: true },
      ];
      const usagesData = [{ order_id: "o1", coupon_id: "c1" }];
      const refsData = [
        { id: "r1", ref_code: "partner-1-ref", label: null, is_active: true, created_at: "2026-01-01" },
      ];
      const refOrdersData = [{ id: "o2" }];
      const allOrdersData = [
        { id: "o1", total_price: 100, created_at: "2026-03-01T00:00:00Z" },
        { id: "o2", total_price: 200, created_at: "2026-04-01T00:00:00Z" },
      ];

      const { client } = setupClient({});

      const fromSpy = client.from;
      let ordersCallCount = 0;
      fromSpy.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "coupons": {
            const couponsEq = vi.fn().mockResolvedValue({ data: couponsData, error: null });
            const couponsSelect = vi.fn().mockReturnValue({ eq: couponsEq });
            return { select: couponsSelect } as never;
          }
          case "coupon_usages": {
            const usagesIn = vi.fn().mockResolvedValue({ data: usagesData, error: null });
            const usagesSelect = vi.fn().mockReturnValue({ in: usagesIn });
            return { select: usagesSelect } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const ordersIn = vi.fn().mockResolvedValue({ data: refOrdersData, error: null });
              const ordersSelect = vi.fn().mockReturnValue({ in: ordersIn });
              return { select: ordersSelect } as never;
            }
            const ordersIn = vi.fn().mockResolvedValue({ data: allOrdersData, error: null });
            const ordersSelect = vi.fn().mockReturnValue({ in: ordersIn });
            return { select: ordersSelect } as never;
          }
          case "partner_refs": {
            const refsEq = vi.fn().mockResolvedValue({ data: refsData, error: null });
            const refsSelect = vi.fn().mockReturnValue({ eq: refsEq });
            return { select: refsSelect } as never;
          }
          case "referral_events": {
            const eventsIn = vi.fn().mockResolvedValue({ data: [], error: null });
            const eventsSelect = vi.fn().mockReturnValue({ in: eventsIn });
            return { select: eventsSelect } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "partner_stats", groupBy: "partner-1" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data.coupon_count).toBe(1);
      expect(body.data.ref_count).toBe(1);
      expect(body.data.total_orders).toBe(2);
      expect(body.data.total_revenue).toBe(300);
      expect(body.data.last_order_date).toBe("2026-04-01T00:00:00Z");
    });
  });

  describe("aggregation: customer_list", () => {
    it("merges multiple orders per customer and sorts by last_order_date", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 50, marketing_consent: false, created_at: "2026-01-10T00:00:00Z" },
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 30, marketing_consent: false, created_at: "2026-03-15T00:00:00Z" },
        { customer_email: "b@t.com", customer_name: "Bob", total_price: 100, marketing_consent: false, created_at: "2026-02-01T00:00:00Z" },
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 20, marketing_consent: false, created_at: "2026-02-20T00:00:00Z" },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "customer_list" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(2);
      expect(body.data[0]).toMatchObject({
        customer_email: "a@t.com",
        customer_name: "Alice",
        order_count: 3,
        total_revenue: 100,
        last_order_date: "2026-03-15T00:00:00Z",
        marketing_consent: false,
      });
      expect(body.data[1]).toMatchObject({
        customer_email: "b@t.com",
        customer_name: "Bob",
        order_count: 1,
        total_revenue: 100,
        last_order_date: "2026-02-01T00:00:00Z",
        marketing_consent: false,
      });
    });

    it("propagates marketing consent from any order", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 50, marketing_consent: false, created_at: "2026-01-01T00:00:00Z" },
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 30, marketing_consent: true, created_at: "2026-02-01T00:00:00Z" },
        { customer_email: "a@t.com", customer_name: "Alice", total_price: 20, marketing_consent: false, created_at: "2026-03-01T00:00:00Z" },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "customer_list" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].marketing_consent).toBe(true);
      expect(body.data[0].order_count).toBe(3);
      expect(body.data[0].total_revenue).toBe(100);
      expect(body.data[0].last_order_date).toBe("2026-03-01T00:00:00Z");
    });
  });

  describe("aggregation: revenue_over_time", () => {
    it("buckets revenue by day with configurable days", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { created_at: "2026-04-01T10:00:00Z", total_price: 100 },
        { created_at: "2026-04-01T14:00:00Z", total_price: 50 },
        { created_at: "2026-04-02T08:00:00Z", total_price: 200 },
        { created_at: "2026-04-05T12:00:00Z", total_price: 75 },
      ];

      setupClient({
        profiles: authCheck,
        orders: {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: ordersData, error: null }),
          }),
        },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "revenue_over_time", aggregate: "30" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(3);
      expect(body.data[0]).toEqual({ date: "2026-04-01", revenue: 150, count: 2 });
      expect(body.data[1]).toEqual({ date: "2026-04-02", revenue: 200, count: 1 });
      expect(body.data[2]).toEqual({ date: "2026-04-05", revenue: 75, count: 1 });
    });

    it("defaults to 30 days when aggregate is not provided", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { created_at: "2026-04-01T10:00:00Z", total_price: 100 },
      ];

      setupClient({
        profiles: authCheck,
        orders: {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: ordersData, error: null }),
          }),
        },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "revenue_over_time" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data).toHaveLength(1);
    });
  });

  describe("aggregation: revenue_by_month", () => {
    it("buckets revenue by month and slices last 12", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData: Array<{ created_at: string; total_price: number }> = [];
      for (let i = 0; i < 15; i++) {
        const year = 2025 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        const mm = String(month).padStart(2, "0");
        ordersData.push({ created_at: `${year}-${mm}-15T00:00:00Z`, total_price: 100 });
      }

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "revenue_by_month" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(12);
      expect(body.data[0].month).toBe("2025-04");
      expect(body.data[11].month).toBe("2026-03");
      for (const bucket of body.data) {
        expect(bucket).toMatchObject({ revenue: 100, count: 1 });
      }
    });
  });

  describe("aggregation: partner_stats (all)", () => {
    it("returns stats for all partners with cross-referenced coupons, refs, orders, revenue", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const partnersData = [
        { id: "p1", company_name: "Partner A", is_active: true, created_at: "2026-01-01" },
        { id: "p2", company_name: "Partner B", is_active: true, created_at: "2026-02-01" },
      ];
      const allCouponsData = [
        { id: "c1", partner_id: "p1" },
        { id: "c2", partner_id: "p2" },
      ];
      const allRefsData = [
        { id: "r1", partner_id: "p1", ref_code: "ref-a" },
        { id: "r2", partner_id: "p2", ref_code: "ref-b" },
      ];
      const usagesData = [
        { coupon_id: "c1", order_id: "o1" },
        { coupon_id: "c2", order_id: "o2" },
      ];
      const refOrdersData = [
        { id: "o3", ref_code: "ref-a" },
        { id: "o4", ref_code: "ref-b" },
      ];
      const allOrdersData = [
        { id: "o1", total_price: 100, created_at: "2026-03-01T00:00:00Z" },
        { id: "o2", total_price: 200, created_at: "2026-02-01T00:00:00Z" },
        { id: "o3", total_price: 150, created_at: "2026-04-01T00:00:00Z" },
        { id: "o4", total_price: 250, created_at: "2026-03-15T00:00:00Z" },
      ];

      const { client } = setupClient({});
      const fromSpy = client.from;
      let ordersCallCount = 0;
      fromSpy.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "partners":
            return { select: vi.fn().mockResolvedValue({ data: partnersData, error: null }) } as never;
          case "coupons":
            return { select: vi.fn().mockResolvedValue({ data: allCouponsData, error: null }) } as never;
          case "partner_refs":
            return { select: vi.fn().mockResolvedValue({ data: allRefsData, error: null }) } as never;
          case "coupon_usages": {
            const usagesIn = vi.fn().mockResolvedValue({ data: usagesData, error: null });
            return { select: vi.fn().mockReturnValue({ in: usagesIn }) } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const ordersIn = vi.fn().mockResolvedValue({ data: refOrdersData, error: null });
              return { select: vi.fn().mockReturnValue({ in: ordersIn }) } as never;
            }
            const ordersIn = vi.fn().mockResolvedValue({ data: allOrdersData, error: null });
            return { select: vi.fn().mockReturnValue({ in: ordersIn }) } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "partner_stats" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(2);
      const p1 = body.data.find((p: { partner_id: string }) => p.partner_id === "p1");
      const p2 = body.data.find((p: { partner_id: string }) => p.partner_id === "p2");
      expect(p1).toMatchObject({
        coupon_count: 1,
        ref_count: 1,
        total_orders: 2,
        total_revenue: 250,
        last_order_date: "2026-04-01T00:00:00Z",
      });
      expect(p2).toMatchObject({
        coupon_count: 1,
        ref_count: 1,
        total_orders: 2,
        total_revenue: 450,
        last_order_date: "2026-03-15T00:00:00Z",
      });
    });
  });

  describe("aggregation: count", () => {
    it("returns total count without groupBy", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ count: 42, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "count" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data).toEqual({ count: 42 });
    });

    it("groups by field and counts with groupBy", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { status: "paid" },
        { status: "paid" },
        { status: "pending_payment" },
        { status: "shipped" },
        { status: "paid" },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "count", groupBy: "status" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(3);
      const paid = body.data.find((r: { status: string }) => r.status === "paid");
      const pending = body.data.find((r: { status: string }) => r.status === "pending_payment");
      const shipped = body.data.find((r: { status: string }) => r.status === "shipped");
      expect(paid.count).toBe(3);
      expect(pending.count).toBe(1);
      expect(shipped.count).toBe(1);
    });
  });

  describe("aggregation: sum", () => {
    it("sums total_price by default without groupBy", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { total_price: 100 },
        { total_price: 200 },
        { total_price: 50 },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "sum" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data).toEqual({ total_price: 350 });
    });

    it("sums custom field when aggregate is specified", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { discount_amount: 10 },
        { discount_amount: 5 },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "sum", aggregate: "discount_amount" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data).toEqual({ discount_amount: 15 });
    });

    it("groups by field and sums with groupBy", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const ordersData = [
        { status: "paid", total_price: 100 },
        { status: "paid", total_price: 200 },
        { status: "shipped", total_price: 50 },
      ];

      setupClient({
        profiles: authCheck,
        orders: { select: vi.fn().mockResolvedValue({ data: ordersData, error: null }) },
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "sum", groupBy: "status" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toHaveLength(2);
      const paid = body.data.find((r: { status: string }) => r.status === "paid");
      const shipped = body.data.find((r: { status: string }) => r.status === "shipped");
      expect(paid).toMatchObject({ total_price: 300, count: 2 });
      expect(shipped).toMatchObject({ total_price: 50, count: 1 });
    });
  });

  describe("aggregation: unsupported", () => {
    it("returns 400 for unknown aggregateFunction", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { aggregateFunction: "nonexistent_agg" },
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toBe("Unsupported aggregation.");
    });
  });

  describe("order status update", () => {
    it("performs valid transition (pending_payment -> paid) with history insert", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", status: "pending_payment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", status: "paid" };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toEqual({ id: "o1", order_number: "ORD-001", status: "paid" });
      expect(body.meta.allowedNextStatuses).toEqual(["cancelled", "refunded"]);
      expect(historyInsertMock).toHaveBeenCalledWith({
        order_id: "o1",
        status_type: "order",
        status: "paid",
        note: "Order status changed from pending_payment to paid.",
      });
    });

    it("returns 409 for invalid transition (cancelled -> paid)", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", status: "cancelled" };

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(409);
      expect(readBody(response).error).toContain("Invalid order status transition from cancelled to paid");
    });

    it("returns 400 for invalid status value", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
          const eq = vi.fn().mockReturnValue({ single });
          const select = vi.fn().mockReturnValue({ eq });
          return { select } as never;
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "unknown_status" },
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = readBody(response).error;
      expect(error).toContain("Invalid order status");
      expect(error).toContain("pending_payment, paid, cancelled, refunded");
    });

    it("returns 404 when order not found", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "nonexistent",
          data: { status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(404);
      expect(readBody(response).error).toBe("Order not found.");
    });

    it("allows same status update (idempotent)", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", status: "paid" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", status: "paid" };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data.status).toBe("paid");
      expect(historyInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ note: "Order status unchanged." }),
      );
    });

    it("passes custom note to history", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", status: "pending_payment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", status: "paid" };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "paid", note: "Payment confirmed by admin" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(historyInsertMock).toHaveBeenCalledWith({
        order_id: "o1",
        status_type: "order",
        status: "paid",
        note: "Payment confirmed by admin",
      });
    });

    it("returns 500 when history insert fails after order update", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", status: "pending_payment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", status: "paid" };

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: vi.fn().mockResolvedValue({ error: { message: "FK violation" } }) } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(500);
      expect(readBody(response).error).toBe("Order status updated but history insert failed.");
    });
  });

  describe("shipment status update", () => {
    it("performs valid transition with tracking number", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", shipment_status: "pending_fulfillment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", shipment_status: "in_transit", tracking_number: "TRACK123" };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          }),
        }),
      });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            return { update: updateMock } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "in_transit", tracking_number: "TRACK123" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data).toEqual({ id: "o1", order_number: "ORD-001", shipment_status: "in_transit", tracking_number: "TRACK123" });
      expect(body.meta.allowedNextShipmentStatuses).toEqual(["delivered", "failed_delivery", "returned"]);
      expect(updateMock).toHaveBeenCalledWith({ shipment_status: "in_transit", tracking_number: "TRACK123" });
      expect(historyInsertMock).toHaveBeenCalledWith({
        order_id: "o1",
        status_type: "shipment",
        status: "in_transit",
        note: "Shipment status changed from pending_fulfillment to in_transit.",
      });
    });

    it("returns 409 for invalid transition (returned -> in_transit)", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", shipment_status: "returned" };

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "in_transit" },
        }),
      });

      expect(response.statusCode).toBe(409);
      expect(readBody(response).error).toContain("Invalid shipment status transition from returned to in_transit");
    });

    it("returns 400 for invalid shipment status value", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
          const eq = vi.fn().mockReturnValue({ single });
          const select = vi.fn().mockReturnValue({ eq });
          return { select } as never;
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "unknown_status" },
        }),
      });

      expect(response.statusCode).toBe(400);
      const error = readBody(response).error;
      expect(error).toContain("Invalid shipmentStatus");
      expect(error).toContain("pending_fulfillment, in_transit, delivered, failed_delivery, returned");
    });

    it("returns 404 when order not found", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "nonexistent",
          data: { shipment_status: "in_transit" },
        }),
      });

      expect(response.statusCode).toBe(404);
      expect(readBody(response).error).toBe("Order not found.");
    });

    it("allows same status update (idempotent)", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", shipment_status: "in_transit" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", shipment_status: "in_transit", tracking_number: null };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "in_transit" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(readBody(response).data.shipment_status).toBe("in_transit");
      expect(historyInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ note: "Shipment details updated." }),
      );
    });

    it("clears tracking number when empty string provided", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", shipment_status: "pending_fulfillment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", shipment_status: "in_transit", tracking_number: null };
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          }),
        }),
      });

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            return { update: updateMock } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "in_transit", tracking_number: "" },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(updateMock).toHaveBeenCalledWith({ shipment_status: "in_transit", tracking_number: null });
    });

    it("returns 500 when history insert fails after shipment update", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const existingOrder = { id: "o1", order_number: "ORD-001", shipment_status: "pending_fulfillment" };
      const updatedOrder = { id: "o1", order_number: "ORD-001", shipment_status: "in_transit", tracking_number: null };

      const { client } = setupClient({});
      let ordersCallCount = 0;
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: existingOrder, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const single = vi.fn().mockResolvedValue({ data: updatedOrder, error: null });
            const select = vi.fn().mockReturnValue({ single });
            const eq = vi.fn().mockReturnValue({ select });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: vi.fn().mockResolvedValue({ error: { message: "FK violation" } }) } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "PATCH",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          id: "o1",
          data: { shipment_status: "in_transit" },
        }),
      });

      expect(response.statusCode).toBe(500);
      expect(readBody(response).error).toBe("Shipment updated but history insert failed.");
    });
  });

  describe("bulk status update", () => {
    it("updates multiple orders successfully with history", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const order1 = { id: "o1", status: "pending_payment" };
      const order2 = { id: "o2", status: "pending_payment" };

      const { client } = setupClient({});
      let ordersCallCount = 0;
      const historyInsertMock = vi.fn().mockResolvedValue({ error: null });
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            ordersCallCount++;
            if (ordersCallCount % 2 === 1) {
              const maybeSingle = vi.fn().mockResolvedValue({ data: ordersCallCount === 1 ? order1 : order2, error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              const select = vi.fn().mockReturnValue({ eq });
              return { select } as never;
            }
            const eq = vi.fn().mockResolvedValue({ error: null });
            const update = vi.fn().mockReturnValue({ eq });
            return { update } as never;
          }
          case "order_status_history":
            return { insert: historyInsertMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: { ids: ["o1", "o2"], status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data.updated).toBe(2);
      expect(body.data.failed).toBe(0);
      expect(body.data.errors).toHaveLength(0);
      expect(historyInsertMock).toHaveBeenCalledTimes(2);
      expect(historyInsertMock).toHaveBeenCalledWith({
        order_id: "o1",
        status_type: "order",
        status: "paid",
        note: "Bulk status update to paid.",
      });
    });

    it("returns mixed results when some orders fail", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const orderFetchResults = [
        { id: "o1", status: "pending_payment" },
        null,
        { id: "o3", status: "cancelled" },
      ];
      let fetchIndex = 0;

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const currentFetchIndex = fetchIndex;
            const select = vi.fn().mockImplementation(() => {
              fetchIndex++;
              const maybeSingle = vi.fn().mockResolvedValue({ data: orderFetchResults[currentFetchIndex], error: null });
              const eq = vi.fn().mockReturnValue({ maybeSingle });
              return { eq };
            });
            const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
            return { select, update } as never;
          }
          case "order_status_history":
            return { insert: vi.fn().mockResolvedValue({ error: null }) } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: { ids: ["o1", "o2", "o3"], status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data.updated).toBe(1);
      expect(body.data.failed).toBe(2);
      expect(body.data.errors).toHaveLength(2);
      expect(body.data.errors[0]).toContain("o2");
      expect(body.data.errors[0]).toContain("not found");
      expect(body.data.errors[1]).toContain("o3");
      expect(body.data.errors[1]).toContain("cannot transition from cancelled to paid");
    });

    it("returns 400 when data is missing", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();
      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing data payload");
    });

    it("returns 400 when ids array is empty", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();
      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: { ids: [], status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Missing or empty ids array");
    });

    it("returns 400 when status is invalid", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();
      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: { ids: ["o1"], status: "invalid_status" },
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Invalid status");
    });

    it("counts non-existent order as failed", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            const eq = vi.fn().mockReturnValue({ maybeSingle });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: { bulkAction: "update_status" },
          data: { ids: ["nonexistent"], status: "paid" },
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = readBody(response);
      expect(body.data.updated).toBe(0);
      expect(body.data.failed).toBe(1);
      expect(body.data.errors[0]).toContain("not found");
    });
  });

  describe("export CSV", () => {
    it("returns CSV response with correct headers (partners)", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const partnersData = [
        { company_name: "Partner A", contact_name: "Alice", nip: "123", contact_email: "a@t.com", phone: "+48123", city: "Warsaw", address: "St 1", notes: "", is_active: true, created_at: "2026-01-01" },
      ];
      const order = vi.fn().mockResolvedValue({ data: partnersData, error: null });
      const select = vi.fn().mockReturnValue({ order });

      setupClient({ profiles: authCheck, partners: { select } });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners", meta: { export: true } }),
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["Content-Type"]).toBe("text/csv");
      expect(response.headers["Content-Disposition"]).toContain("attachment");
      expect(response.headers["Content-Disposition"]).toContain("partners-export-");
      expect(response.body).toContain("Company Name");
    });

    it("exports orders CSV with field escaping", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const ordersData = [
        {
          order_number: "ORD-001", status: "paid",
          customer_name: "Smith, John", customer_email: "j@t.com",
          customer_phone: "+48123", total_price: 199.99,
          discount_amount: 10, coupon_code: null,
          payment_status: "completed", shipment_status: "in_transit",
          tracking_number: "TRK1", created_at: "2026-04-01",
        },
      ];

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders": {
            const orderMock = vi.fn().mockResolvedValue({ data: ordersData, error: null });
            const select = vi.fn().mockReturnValue({ order: orderMock });
            return { select } as never;
          }
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "orders", meta: { export: true } }),
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["Content-Type"]).toBe("text/csv");
      expect(response.body).toContain("Order #");
      expect(response.body).toContain('"Smith, John"');
      expect(response.headers["Content-Disposition"]).toContain("orders-export-");
    });

    it("exports coupons CSV with correct columns", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const couponsData = [
        { code: "SAVE10", description: "Save 10%", discount_type: "percentage", discount_value: 10, currency: "PLN", min_order_amount: null, max_uses: 100, used_count: 5, is_active: true, valid_from: null, valid_until: null, created_at: "2026-01-01" },
      ];
      const order = vi.fn().mockResolvedValue({ data: couponsData, error: null });
      const select = vi.fn().mockReturnValue({ order });

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const s = vi.fn().mockReturnValue({ eq });
            return { select: s } as never;
          }
          case "coupons":
            return { select } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "coupons", meta: { export: true } }),
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("Code");
      expect(response.body).toContain("SAVE10");
    });

    it("rejects customers export because resource is not in allowed list", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();
      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "customers", meta: { export: true } }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Invalid resource");
    });

    it("returns 400 for unsupported export resource", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();
      setupClient({ profiles: authCheck });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "order_items", meta: { export: true } }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toBe("Export not supported for this resource.");
    });

    it("applies filters to orders export", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const ordersData = [
        { order_number: "ORD-001", status: "paid", customer_name: "Alice", customer_email: "a@t.com", customer_phone: null, total_price: 100, discount_amount: 0, coupon_code: null, payment_status: "completed", shipment_status: "pending_fulfillment", tracking_number: null, created_at: "2026-04-01" },
      ];
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: ordersData, error: null });
      const chainable = { eq: eqMock, order: orderMock };
      const selectMock = vi.fn().mockReturnValue(chainable);

      const { client } = setupClient({});
      client.from.mockImplementation((table: string) => {
        switch (table) {
          case "profiles": {
            const single = vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null });
            const eq = vi.fn().mockReturnValue({ single });
            const select = vi.fn().mockReturnValue({ eq });
            return { select } as never;
          }
          case "orders":
            return { select: selectMock } as never;
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          resource: "orders",
          meta: {
            export: true,
            filters: [{ field: "status", operator: "eq", value: "paid" }],
          },
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(eqMock).toHaveBeenCalledWith("status", "paid");
    });
  });

  describe("GET list features", () => {
    it("applies filters to list query", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: [{ id: "p1" }], error: null, count: 1 }),
        }),
      });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      setupClient({ profiles: makeAdminAuthCheck(), partners: { select: selectMock } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: {
          resource: "partners",
          filters: JSON.stringify([{ field: "is_active", operator: "eq", value: true }]),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(eqMock).toHaveBeenCalledWith("is_active", true);
    });

    it("applies custom sorters", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const orderMock = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });

      setupClient({ profiles: makeAdminAuthCheck(), partners: { select: selectMock } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: {
          resource: "partners",
          sorters: JSON.stringify([{ field: "company_name", order: "asc" }]),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(orderMock).toHaveBeenCalledWith("company_name", { ascending: true });
    });

    it("uses custom select fields", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const orderMock = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });

      setupClient({ profiles: makeAdminAuthCheck(), partners: { select: selectMock } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: {
          resource: "partners",
          select: "id,company_name",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(selectMock).toHaveBeenCalledWith("id,company_name", expect.any(Object));
    });

    it("defaults to created_at desc sorting", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const orderMock = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });

      setupClient({ profiles: makeAdminAuthCheck(), partners: { select: selectMock } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: { resource: "partners" },
      });

      expect(response.statusCode).toBe(200);
      expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("returns 500 on Supabase error", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const orderMock = vi.fn().mockReturnValue({
        range: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" }, count: null }),
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });

      setupClient({ profiles: makeAdminAuthCheck(), partners: { select: selectMock } });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
        queryStringParameters: { resource: "partners" },
      });

      expect(response.statusCode).toBe(500);
      expect(readBody(response).error).toBe("DB error");
    });
  });

  describe("edge cases", () => {
    it("returns 400 for invalid JSON body", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      setupClient({ profiles: makeAdminAuthCheck() });

      const response = await handler({
        httpMethod: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: "not json{{{",
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response).error).toContain("Invalid request body");
    });

    it("returns 405 for unsupported HTTP method", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      setupClient({ profiles: makeAdminAuthCheck() });

      const response = await handler({
        httpMethod: "OPTIONS",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ resource: "partners" }),
      });

      expect(response.statusCode).toBe(405);
      expect(readBody(response).error).toBe("Method Not Allowed");
    });

    it("returns 500 when env vars are missing", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SECRET_KEY;

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer some-token" },
      });

      expect(response.statusCode).toBe(500);
      expect(readBody(response).error).toContain("Missing Supabase configuration");
    });

    it("returns 500 when auth request fails with network error", async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error("Network error");
      });

      const response = await handler({
        httpMethod: "GET",
        headers: { authorization: "Bearer valid-token" },
      });

      expect(response.statusCode).toBe(500);
      expect(readBody(response).error).toContain("Auth request failed");
    });
  });
});
