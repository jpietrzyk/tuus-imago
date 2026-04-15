import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
    },
  },
}));

vi.mock("@/components/image-uploader", () => ({}));

import {
  createOrder,
  getOrderStatus,
  createP24Session,
  validateCoupon,
  getCustomerOrders,
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type CustomerAddress,
} from "./orders-api";

const AUTHED_HEADERS = {
  Authorization: "Bearer test-token",
  "Content-Type": "application/json",
};

function mockFetchSuccess(data: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(data),
    }),
  );
}

function mockFetchError(errorMsg: string, status = 400) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error: errorMsg }),
    }),
  );
}

describe("orders-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: "refreshed-token" } },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("createOrder", () => {
    it("sends POST to create-order and returns response", async () => {
      const response = {
        orderId: "1",
        orderNumber: "ORD-001",
        status: "pending",
      };
      mockFetchSuccess(response);

      const result = await createOrder({
        customer: {
          name: "Jan",
          email: "jan@test.com",
          phone: "123",
          address: "ul. Test",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
        },
        uploadedSlots: [],
        idempotencyKey: "key-1",
      });

      expect(result).toEqual(response);
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/create-order",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("throws on error response", async () => {
      mockFetchError("Order creation failed");

      await expect(
        createOrder({
          customer: {
            name: "Jan",
            email: "jan@test.com",
            phone: "123",
            address: "ul. Test",
            city: "Warsaw",
            postalCode: "00-001",
            country: "PL",
            termsAccepted: true,
            privacyAccepted: true,
            marketingConsent: false,
          },
          uploadedSlots: [],
          idempotencyKey: "key-1",
        }),
      ).rejects.toThrow("Order creation failed");
    });

    it("passes AbortSignal to fetch", async () => {
      const response = {
        orderId: "1",
        orderNumber: "ORD-001",
        status: "pending",
      };
      mockFetchSuccess(response);
      const controller = new AbortController();

      await createOrder(
        {
          customer: {
            name: "Jan",
            email: "jan@test.com",
            phone: "123",
            address: "ul. Test",
            city: "Warsaw",
            postalCode: "00-001",
            country: "PL",
            termsAccepted: true,
            privacyAccepted: true,
            marketingConsent: false,
          },
          uploadedSlots: [],
          idempotencyKey: "key-1",
        },
        controller.signal,
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe("getOrderStatus", () => {
    it("fetches order status by orderId", async () => {
      const response = {
        status: "pending",
        payment_status: "paid",
        order_number: "ORD-001",
      };
      mockFetchSuccess(response);

      const result = await getOrderStatus("order-123");
      expect(result).toEqual(response);
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/order-status?orderId=order-123",
      );
    });

    it("throws on error response", async () => {
      mockFetchError("Not found");

      await expect(getOrderStatus("bad-id")).rejects.toThrow("Not found");
    });
  });

  describe("createP24Session", () => {
    it("sends POST to create payment session", async () => {
      const response = {
        orderId: "1",
        orderNumber: "ORD-001",
        paymentSessionId: "p24-123",
        redirectUrl: "https://p24.example.com",
      };
      mockFetchSuccess(response);

      const result = await createP24Session({ orderId: "1" });
      expect(result).toEqual(response);
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/create-przelewy24-session",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("passes AbortSignal", async () => {
      const response = {
        orderId: "1",
        orderNumber: "ORD-001",
        paymentSessionId: "p24-123",
        redirectUrl: "https://p24.example.com",
      };
      mockFetchSuccess(response);
      const controller = new AbortController();

      await createP24Session({ orderId: "1" }, controller.signal);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it("throws on error", async () => {
      mockFetchError("Payment failed");
      await expect(
        createP24Session({ orderId: "1" }),
      ).rejects.toThrow("Payment failed");
    });
  });

  describe("validateCoupon", () => {
    it("sends POST to validate-coupon and returns response", async () => {
      const response = { valid: true, discountAmount: 20 };
      mockFetchSuccess(response);

      const result = await validateCoupon("SAVE20", 200);
      expect(result).toEqual(response);

      const callBody = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody).toEqual({ code: "SAVE20", orderTotal: 200 });
    });
  });

  describe("getCustomerOrders", () => {
    it("fetches all orders when no orderId", async () => {
      const orders = [{ id: "1" }, { id: "2" }];
      mockFetchSuccess({ orders });

      const result = await getCustomerOrders();
      expect(result).toEqual({ orders });
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/customer-orders",
        expect.objectContaining({ headers: AUTHED_HEADERS }),
      );
    });

    it("fetches single order by orderId", async () => {
      const order = { id: "1", items: [] };
      mockFetchSuccess({ order });

      const result = await getCustomerOrders("order-1");
      expect(result).toEqual({ order });
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/customer-orders?orderId=order-1",
        expect.any(Object),
      );
    });

    it("throws on non-2xx", async () => {
      mockFetchError("Forbidden");
      await expect(getCustomerOrders()).rejects.toThrow("Forbidden");
    });
  });

  describe("getCustomerAddresses", () => {
    it("fetches addresses list", async () => {
      const addresses = [{ id: "a1" }, { id: "a2" }];
      mockFetchSuccess({ addresses });

      const result = await getCustomerAddresses();
      expect(result).toEqual(addresses);
    });

    it("throws on error", async () => {
      mockFetchError("Unauthorized");
      await expect(getCustomerAddresses()).rejects.toThrow("Unauthorized");
    });
  });

  describe("createCustomerAddress", () => {
    it("sends POST to create address", async () => {
      const address = {
        id: "a1",
        user_id: "u1",
        label: "Home",
        name: "Jan",
        phone: null,
        address: "ul. Test",
        city: "Warsaw",
        postal_code: "00-001",
        country: "PL",
        is_default: false,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      } as CustomerAddress;
      mockFetchSuccess({ address });

      const result = await createCustomerAddress({
        label: "Home",
        name: "Jan",
        phone: null,
        address: "ul. Test",
        city: "Warsaw",
        postal_code: "00-001",
        country: "PL",
        is_default: false,
      });
      expect(result).toEqual(address);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("throws on error", async () => {
      mockFetchError("Validation error");
      await expect(
        createCustomerAddress({
          label: "",
          name: "",
          phone: null,
          address: "",
          city: "",
          postal_code: "",
          country: "",
          is_default: false,
        }),
      ).rejects.toThrow("Validation error");
    });
  });

  describe("updateCustomerAddress", () => {
    it("sends PATCH to update address", async () => {
      const address = {
        id: "a1",
        user_id: "u1",
        label: "Work",
        name: "Jan",
        phone: null,
        address: "ul. New",
        city: "Krakow",
        postal_code: "30-001",
        country: "PL",
        is_default: true,
        created_at: "2025-01-01",
        updated_at: "2025-01-02",
      } as CustomerAddress;
      mockFetchSuccess({ address });

      const result = await updateCustomerAddress("a1", { label: "Work" });
      expect(result).toEqual(address);

      const callBody = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody).toEqual({ id: "a1", label: "Work" });
    });

    it("throws on error", async () => {
      mockFetchError("Not found");
      await expect(
        updateCustomerAddress("bad", { label: "X" }),
      ).rejects.toThrow("Not found");
    });
  });

  describe("deleteCustomerAddress", () => {
    it("sends DELETE to remove address", async () => {
      mockFetchSuccess({});

      await deleteCustomerAddress("a1");

      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/customer-addresses?id=a1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("throws on error", async () => {
      mockFetchError("Not found");
      await expect(deleteCustomerAddress("bad")).rejects.toThrow("Not found");
    });
  });

  describe("auth headers", () => {
    it("includes Bearer token when session exists", async () => {
      mockFetchSuccess({ orders: [] });

      await getCustomerOrders();

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .headers;
      expect(headers.Authorization).toBe("Bearer test-token");
    });

    it("refreshes token when session is null", async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });
      mockRefreshSession.mockResolvedValueOnce({
        data: { session: { access_token: "refreshed-token" } },
      });
      mockFetchSuccess({ orders: [] });

      await getCustomerOrders();

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .headers;
      expect(headers.Authorization).toBe("Bearer refreshed-token");
    });

    it("sends request without auth header when no token available", async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });
      mockRefreshSession.mockResolvedValueOnce({ data: { session: null } });
      mockFetchSuccess({ orders: [] });

      await getCustomerOrders();

      const headers = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
        .headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
