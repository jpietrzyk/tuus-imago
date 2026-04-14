import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer test-token",
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { adminDataProvider } from "./data-provider";

function mockFetchOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, error: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

function getFetchUrl(): string {
  return mockFetch.mock.calls[0][0] as string;
}

function getFetchOptions(): RequestInit {
  return mockFetch.mock.calls[0][1] as RequestInit;
}

describe("adminDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getList", () => {
    it("builds GET request with pagination", async () => {
      mockFetchOk({ data: [{ id: "1" }], total: 1 });

      const result = await adminDataProvider.getList({
        resource: "partners",
        pagination: { currentPage: 2, pageSize: 10 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      const url = new URL(getFetchUrl(), "http://localhost");
      expect(url.searchParams.get("resource")).toBe("partners");
      expect(JSON.parse(url.searchParams.get("pagination")!)).toEqual({
        current: 2,
        pageSize: 10,
      });
    });

    it("includes sorters in URL", async () => {
      mockFetchOk({ data: [], total: 0 });

      await adminDataProvider.getList({
        resource: "partners",
        sorters: [{ field: "name", order: "asc" }],
      });

      const url = new URL(getFetchUrl(), "http://localhost");
      const sorters = JSON.parse(url.searchParams.get("sorters")!);
      expect(sorters).toEqual([{ field: "name", order: "asc" }]);
    });

    it("maps and includes filters in URL", async () => {
      mockFetchOk({ data: [], total: 0 });

      await adminDataProvider.getList({
        resource: "partners",
        filters: [
          { field: "is_active", operator: "eq", value: true },
        ],
      });

      const url = new URL(getFetchUrl(), "http://localhost");
      const filters = JSON.parse(url.searchParams.get("filters")!);
      expect(filters).toEqual([
        { field: "is_active", operator: "eq", value: true },
      ]);
    });

    it("includes meta.select in URL", async () => {
      mockFetchOk({ data: [], total: 0 });

      await adminDataProvider.getList({
        resource: "partners",
        meta: { select: "id,company_name" },
      });

      const url = new URL(getFetchUrl(), "http://localhost");
      expect(url.searchParams.get("select")).toBe("id,company_name");
    });

    it("throws HttpError on failure", async () => {
      mockFetchError(500, "DB error");

      await expect(
        adminDataProvider.getList({ resource: "partners" }),
      ).rejects.toEqual({
        message: "DB error",
        statusCode: 500,
      });
    });
  });

  describe("getOne", () => {
    it("builds GET request with id", async () => {
      mockFetchOk({ data: { id: "p1", name: "Partner" } });

      const result = await adminDataProvider.getOne({
        resource: "partners",
        id: "p1",
      });

      expect(result.data).toEqual({ id: "p1", name: "Partner" });
      const url = new URL(getFetchUrl(), "http://localhost");
      expect(url.searchParams.get("resource")).toBe("partners");
      expect(url.searchParams.get("id")).toBe("p1");
    });
  });

  describe("getMany", () => {
    it("builds filter with ids", async () => {
      mockFetchOk({ data: [{ id: "1" }, { id: "2" }] });

      const result = await adminDataProvider.getMany({
        resource: "partners",
        ids: ["1", "2"],
      });

      expect(result.data).toHaveLength(2);
      const url = new URL(getFetchUrl(), "http://localhost");
      const filters = JSON.parse(url.searchParams.get("filters")!);
      expect(filters).toEqual([
        { field: "id", operator: "in", value: ["1", "2"] },
      ]);
    });
  });

  describe("create", () => {
    it("sends POST with correct body", async () => {
      mockFetchOk({ data: { id: "new", name: "New" } });

      const result = await adminDataProvider.create({
        resource: "partners",
        variables: { name: "New" },
      });

      expect(result.data).toEqual({ id: "new", name: "New" });
      const opts = getFetchOptions();
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body as string)).toEqual({
        resource: "partners",
        data: { name: "New" },
      });
    });

    it("includes meta in body when provided", async () => {
      mockFetchOk({ data: {} });

      await adminDataProvider.create({
        resource: "orders",
        variables: {},
        meta: { aggregateFunction: "count" },
      });

      const body = JSON.parse(getFetchOptions().body as string);
      expect(body.meta).toEqual({ aggregateFunction: "count" });
    });
  });

  describe("update", () => {
    it("sends PATCH with correct body", async () => {
      mockFetchOk({ data: { id: "p1", name: "Updated" } });

      const result = await adminDataProvider.update({
        resource: "partners",
        id: "p1",
        variables: { name: "Updated" },
      });

      expect(result.data).toEqual({ id: "p1", name: "Updated" });
      const opts = getFetchOptions();
      expect(opts.method).toBe("PATCH");
      expect(JSON.parse(opts.body as string)).toEqual({
        resource: "partners",
        id: "p1",
        data: { name: "Updated" },
      });
    });
  });

  describe("deleteOne", () => {
    it("sends DELETE with correct body", async () => {
      mockFetchOk({ data: null });

      await adminDataProvider.deleteOne({
        resource: "coupons",
        id: "c1",
      });

      const opts = getFetchOptions();
      expect(opts.method).toBe("DELETE");
      expect(JSON.parse(opts.body as string)).toEqual({
        resource: "coupons",
        id: "c1",
      });
    });
  });

  describe("getApiUrl", () => {
    it("returns the API URL constant", () => {
      expect(adminDataProvider.getApiUrl()).toBe(
        "/.netlify/functions/admin-api",
      );
    });
  });
});
