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
    it("returns stats for a single partner", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });

      const couponsData = [
        { id: "c1", code: "PARTNER10", discount_type: "percentage", discount_value: 10, used_count: 3, is_active: true },
      ];
      const usagesData = [{ order_id: "o1", coupon_id: "c1" }, { order_id: "o2", coupon_id: "c1" }];
      const ordersData = [
        { id: "o1", total_price: 100, created_at: "2026-03-01T00:00:00Z" },
        { id: "o2", total_price: 200, created_at: "2026-04-01T00:00:00Z" },
      ];

      const { client } = setupClient({});

      const fromSpy = client.from;
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
            const ordersIn = vi.fn().mockResolvedValue({ data: ordersData, error: null });
            const ordersSelect = vi.fn().mockReturnValue({ in: ordersIn });
            return { select: ordersSelect } as never;
          }
          case "partner_refs": {
            const refsEq = vi.fn().mockResolvedValue({ data: [], error: null });
            const refsSelect = vi.fn().mockReturnValue({ eq: refsEq });
            return { select: refsSelect } as never;
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
      expect(body.data.total_orders).toBe(2);
      expect(body.data.total_revenue).toBe(300);
      expect(body.data.last_order_date).toBe("2026-04-01T00:00:00Z");
    });
  });

  describe("export CSV", () => {
    it("returns CSV response with correct headers", async () => {
      mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
      const authCheck = makeAdminAuthCheck();

      const partnersData = [
        { id: "p1", company_name: "Partner A", is_active: true, created_at: "2026-01-01" },
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
    });
  });
});
