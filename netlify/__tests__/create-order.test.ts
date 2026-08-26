import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/create-order";
import {
  createDeleteEq,
  createInsertSelectSingle,
  createSelectEqMaybeSingle,
  mockSupabaseClient,
  readBody,
} from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function buildCustomer() {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    address: "Main 1",
    city: "Warsaw",
    postalCode: "00-001",
    country: "PL",
    termsAccepted: true,
    privacyAccepted: true,
    marketingConsent: false,
  };
}

function createPromotionsNoActiveMock() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, maybeSingle };
}

describe("create-order handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  it("returns 400 when idempotency key is missing", async () => {
    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
        },
        uploadedSlots: [],
      }),
    });

    expect(response.statusCode).toBe(400);
    expect(readBody(response)).toEqual({ error: "Missing idempotency key." });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("creates an order, items, and initial history", async () => {
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const historyInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: vi.fn(),
      },
      order_items: {
        insert: orderItemsInsert,
      },
      order_status_history: {
        insert: historyInsert,
      },
      promotions: createPromotionsNoActiveMock(),
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "123456789",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: true,
        },
        idempotencyKey: "checkout-submit-1",
        uploadedSlots: [
          {
            slotIndex: 0,
            slotKey: "left",
            transformedUrl: "https://example.com/image.jpg",
            publicId: "public-1",
            secureUrl: "https://example.com/secure-image.jpg",
            transformations: {
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
              brightness: 0,
              contrast: 0,
              grayscale: 0,
              blur: 0,
            },
            aiAdjustments: {
              enhance: true,
              removeBackground: false,
              upscale: false,
              restore: false,
            },
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-1",
      orderNumber: "TI-2026-000001",
      status: "pending_payment",
    });
    expect(orderInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        idempotency_key: "checkout-submit-1",
        shipping_method: "inpost_courier",
        shipment_status: "pending_fulfillment",
        items_count: 1,
      }),
    );
    expect(orderItemsInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: "order-1",
        slot_key: "left",
        transformed_url: "https://example.com/image.jpg",
      }),
    ]);
    expect(historyInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: "order-1",
        status_type: "order",
        status: "pending_payment",
      }),
      expect.objectContaining({
        order_id: "order-1",
        status_type: "shipment",
        status: "pending_fulfillment",
      }),
    ]);
  });

  it("returns the existing order for an idempotent retry", async () => {
    const { select: ordersSelect, eq } = createSelectEqMaybeSingle({
      data: {
        id: "order-existing",
        order_number: "TI-2026-000123",
        status: "pending_payment",
      },
      error: null,
    });
    const { insert: orderInsert } = createInsertSelectSingle({
      data: null,
      error: { code: "23505" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: ordersSelect,
        delete: vi.fn(),
      },
      order_items: {
        insert: vi.fn(),
      },
      order_status_history: {
        insert: vi.fn(),
      },
      promotions: createPromotionsNoActiveMock(),
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "",
          address: "Main 1",
          city: "Warsaw",
          postalCode: "00-001",
          country: "PL",
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
        },
        uploadedSlots: [],
        idempotencyKey: "checkout-submit-1",
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({
      orderId: "order-existing",
      orderNumber: "TI-2026-000123",
      status: "pending_payment",
    });
    expect(ordersSelect).toHaveBeenCalledWith("id, order_number, status");
    expect(eq).toHaveBeenCalledWith("idempotency_key", "checkout-submit-1");
  });

  it("deletes the order when item persistence fails", async () => {
    const { delete: orderDelete, eq: rollbackEq } = createDeleteEq();
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const orderItemsInsert = vi.fn().mockResolvedValue({
      error: { message: "insert failed" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: orderDelete,
      },
      order_items: {
        insert: orderItemsInsert,
      },
      order_status_history: {
        insert: vi.fn(),
      },
      promotions: createPromotionsNoActiveMock(),
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: buildCustomer(),
        idempotencyKey: "checkout-submit-rollback-items",
        uploadedSlots: [
          {
            slotIndex: 0,
            slotKey: "left",
            transformedUrl: "https://example.com/image.jpg",
            transformations: {
              rotation: 0,
              flipHorizontal: false,
              flipVertical: false,
              brightness: 0,
              contrast: 0,
              grayscale: 0,
              blur: 0,
            },
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(500);
    expect(readBody(response)).toEqual({ error: "Could not persist order items." });
    expect(orderDelete).toHaveBeenCalled();
    expect(rollbackEq).toHaveBeenCalledWith("id", "order-1");
  });

  it("deletes the order when history persistence fails", async () => {
    const { delete: orderDelete, eq: rollbackEq } = createDeleteEq();
    const { insert: orderInsert } = createInsertSelectSingle({
      data: {
        id: "order-1",
        order_number: "TI-2026-000001",
        status: "pending_payment",
      },
      error: null,
    });
    const historyInsert = vi.fn().mockResolvedValue({
      error: { message: "history insert failed" },
    });

    mockSupabaseClient(createClientMock, {
      orders: {
        insert: orderInsert,
        select: vi.fn(),
        delete: orderDelete,
      },
      order_items: {
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
      order_status_history: {
        insert: historyInsert,
      },
      promotions: createPromotionsNoActiveMock(),
    });

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        customer: buildCustomer(),
        idempotencyKey: "checkout-submit-rollback-history",
        uploadedSlots: [],
      }),
    });

    expect(response.statusCode).toBe(500);
    expect(readBody(response)).toEqual({
      error: "Could not persist order status history.",
    });
    expect(orderDelete).toHaveBeenCalled();
    expect(rollbackEq).toHaveBeenCalledWith("id", "order-1");
    expect(historyInsert).toHaveBeenCalled();
  });

  describe("promotion discount", () => {
    function buildBaseMocks() {
      const { insert: orderInsert } = createInsertSelectSingle({
        data: {
          id: "order-promo-1",
          order_number: "TI-2026-000100",
          status: "pending_payment",
        },
        error: null,
      });
      const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
      const historyInsert = vi.fn().mockResolvedValue({ error: null });
      const promotionsMaybeSingle = vi.fn();
      const promotionsEq = vi.fn().mockReturnValue({ maybeSingle: promotionsMaybeSingle });
      const promotionsSelect = vi.fn().mockReturnValue({ eq: promotionsEq });

      return {
        orderInsert,
        orderItemsInsert,
        historyInsert,
        promotionsSelect,
        promotionsEq,
        promotionsMaybeSingle,
      };
    }

    function setupMocksWithPromotion(
      mocks: ReturnType<typeof buildBaseMocks>,
      promotionData: unknown,
    ) {
      mocks.promotionsMaybeSingle.mockResolvedValue({ data: promotionData, error: null });

      mockSupabaseClient(createClientMock, {
        orders: {
          insert: mocks.orderInsert,
          select: vi.fn(),
          delete: vi.fn(),
        },
        order_items: {
          insert: mocks.orderItemsInsert,
        },
        order_status_history: {
          insert: mocks.historyInsert,
        },
        coupons: {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
        },
        promotions: {
          select: mocks.promotionsSelect,
        },
      });
    }

    it("applies promotion percentage discount on subtotal", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, {
        id: "promo-1",
        discount_type: "percentage",
        discount_value: 10,
        min_order_amount: null,
        min_slots: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
      });

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-1",
          uploadedSlots: [],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_id: "promo-1",
          promotion_discount_amount: 20,
          total_price: 180,
          discount_amount: 0,
        }),
      );
    });

    it("applies promotion fixed_amount discount on subtotal", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, {
        id: "promo-2",
        discount_type: "fixed_amount",
        discount_value: 50,
        min_order_amount: null,
        min_slots: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
      });

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-2",
          uploadedSlots: [],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_id: "promo-2",
          promotion_discount_amount: 50,
          total_price: 150,
        }),
      );
    });

    it("does not apply promotion when min_slots is not met", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, {
        id: "promo-3",
        discount_type: "percentage",
        discount_value: 20,
        min_order_amount: null,
        min_slots: 2,
        valid_from: null,
        valid_until: null,
        is_active: true,
      });

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-3",
          uploadedSlots: [],
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_discount_amount: 0,
          total_price: 200,
        }),
      );
    });

    it("does not apply promotion when min_order_amount is not met", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, {
        id: "promo-4",
        discount_type: "fixed_amount",
        discount_value: 30,
        min_order_amount: 400,
        min_slots: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
      });

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-4",
          uploadedSlots: [],
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_discount_amount: 0,
          total_price: 200,
        }),
      );
    });

    it("stacks promotion discount with coupon discount", async () => {
      const mocks = buildBaseMocks();
      mocks.promotionsMaybeSingle.mockResolvedValue({
        data: {
          id: "promo-5",
          discount_type: "percentage",
          discount_value: 10,
          min_order_amount: null,
          min_slots: null,
          valid_from: null,
          valid_until: null,
          is_active: true,
        },
        error: null,
      });

      const couponMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: "coupon-1",
          code: "SAVE10",
          discount_type: "percentage",
          discount_value: 10,
          min_order_amount: null,
          max_uses: null,
          used_count: 0,
          valid_from: null,
          valid_until: null,
          is_active: true,
        },
        error: null,
      });
      const couponEq2 = vi.fn().mockReturnValue({ maybeSingle: couponMaybeSingle });
      const couponEq = vi.fn().mockReturnValue({ eq: couponEq2 });
      const couponSelect = vi.fn().mockReturnValue({ eq: couponEq });

      const rpcMock = vi.fn().mockResolvedValue({ error: null });
      const couponUsagesInsert = vi.fn().mockResolvedValue({ error: null });

      const supabaseMock = {
        from: vi.fn((table: string) => {
          const tables: Record<string, unknown> = {
            orders: {
              insert: mocks.orderInsert,
              select: vi.fn(),
              delete: vi.fn(),
            },
            order_items: {
              insert: mocks.orderItemsInsert,
            },
            order_status_history: {
              insert: mocks.historyInsert,
            },
            coupons: {
              select: couponSelect,
            },
            promotions: {
              select: mocks.promotionsSelect,
            },
            coupon_usages: {
              insert: couponUsagesInsert,
            },
          };
          if (!(table in tables)) {
            throw new Error(`Unexpected table: ${table}`);
          }
          return tables[table] as never;
        }),
        rpc: rpcMock,
      };

      createClientMock.mockReturnValue(supabaseMock as never);

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-5",
          uploadedSlots: [],
          couponCode: "SAVE10",
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          coupon_id: "coupon-1",
          coupon_code: "SAVE10",
          discount_amount: 20,
          promotion_id: "promo-5",
          promotion_discount_amount: 20,
          total_price: 160,
        }),
      );
    });

    it("clamps total_price to 0 when discounts exceed subtotal", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, {
        id: "promo-6",
        discount_type: "fixed_amount",
        discount_value: 300,
        min_order_amount: null,
        min_slots: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
      });

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-6",
          uploadedSlots: [],
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_discount_amount: 200,
          total_price: 0,
        }),
      );
    });

    it("does not apply promotion when no active promotion exists", async () => {
      const mocks = buildBaseMocks();
      setupMocksWithPromotion(mocks, null);

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "promo-test-none",
          uploadedSlots: [],
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          promotion_discount_amount: 0,
          total_price: 200,
        }),
      );
    });
  });

  describe("picture frames", () => {
    function buildSlot(
      slotKey: "left" | "center" | "right",
      slotIndex: number,
      frameId?: string | null,
    ) {
      return {
        slotIndex,
        slotKey,
        transformedUrl: `https://example.com/${slotKey}.jpg`,
        publicId: `public-${slotKey}`,
        secureUrl: `https://example.com/secure-${slotKey}.jpg`,
        ...(frameId !== undefined ? { frameId } : {}),
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
        aiAdjustments: null,
      };
    }

    function setupFramesMocks(
      frameRows: Array<{ id: string; name: string; price: number | string }>,
    ) {
      const { insert: orderInsert } = createInsertSelectSingle({
        data: {
          id: "order-frames-1",
          order_number: "TI-2026-000200",
          status: "pending_payment",
        },
        error: null,
      });
      const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
      const historyInsert = vi.fn().mockResolvedValue({ error: null });

      const framesEq = vi.fn().mockResolvedValue({ data: frameRows, error: null });
      const framesIn = vi.fn().mockReturnValue({ eq: framesEq });
      const framesSelect = vi.fn().mockReturnValue({ in: framesIn });

      mockSupabaseClient(createClientMock, {
        orders: {
          insert: orderInsert,
          select: vi.fn(),
          delete: vi.fn(),
        },
        order_items: {
          insert: orderItemsInsert,
        },
        order_status_history: {
          insert: historyInsert,
        },
        promotions: createPromotionsNoActiveMock(),
        picture_frames: {
          select: framesSelect,
        },
      });

      return { orderInsert, orderItemsInsert, historyInsert };
    }

    it("adds frame surcharge and snapshots frame data on order items", async () => {
      const mocks = setupFramesMocks([
        { id: "frame-1", name: "Oak Classic", price: "49.00" },
      ]);

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "frames-test-1",
          uploadedSlots: [buildSlot("left", 0, "frame-1")],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          total_price: 249,
        }),
      );
      expect(mocks.orderItemsInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          frame_id: "frame-1",
          frame_name: "Oak Classic",
          frame_price: 49,
        }),
      ]);
    });

    it("supports mixed framed and unframed slots", async () => {
      const mocks = setupFramesMocks([
        { id: "frame-1", name: "Oak Classic", price: 49 },
        { id: "frame-2", name: "Black Metal", price: 35 },
      ]);

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "frames-test-2",
          uploadedSlots: [
            buildSlot("left", 0, "frame-1"),
            buildSlot("center", 1, "frame-2"),
            buildSlot("right", 2, null),
          ],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          items_count: 3,
          total_price: 684,
        }),
      );
      expect(mocks.orderItemsInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          slot_key: "left",
          frame_id: "frame-1",
          frame_price: 49,
        }),
        expect.objectContaining({
          slot_key: "center",
          frame_id: "frame-2",
          frame_price: 35,
        }),
        expect.objectContaining({
          slot_key: "right",
          frame_id: null,
          frame_name: null,
          frame_price: 0,
        }),
      ]);
    });

    it("rejects unavailable frame ids with 400", async () => {
      setupFramesMocks([]);

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "frames-test-3",
          uploadedSlots: [buildSlot("left", 0, "frame-missing")],
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response)).toEqual({
        error: "Selected frame is not available.",
      });
    });

    it("includes frames in the coupon min order amount base", async () => {
      const mocks = setupFramesMocks([
        { id: "frame-1", name: "Oak Classic", price: 50 },
      ]);

      const couponMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: "coupon-frames",
          code: "FRAME50",
          discount_type: "fixed_amount",
          discount_value: 20,
          min_order_amount: 240,
          max_uses: null,
          used_count: 0,
          valid_from: null,
          valid_until: null,
          is_active: true,
        },
        error: null,
      });
      const couponEq2 = vi.fn().mockReturnValue({ maybeSingle: couponMaybeSingle });
      const couponEq = vi.fn().mockReturnValue({ eq: couponEq2 });
      const couponSelect = vi.fn().mockReturnValue({ eq: couponEq });

      const supabaseMock = {
        from: vi.fn((table: string) => {
          const tables: Record<string, unknown> = {
            orders: { insert: mocks.orderInsert, select: vi.fn(), delete: vi.fn() },
            order_items: { insert: mocks.orderItemsInsert },
            order_status_history: { insert: mocks.historyInsert },
            promotions: createPromotionsNoActiveMock(),
            picture_frames: { select: vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: "frame-1", name: "Oak Classic", price: 50 }], error: null }) }) }) },
            coupons: { select: couponSelect },
            coupon_usages: { insert: vi.fn().mockResolvedValue({ error: null }) },
          };
          if (!(table in tables)) {
            throw new Error(`Unexpected table: ${table}`);
          }
          return tables[table] as never;
        }),
        rpc: vi.fn().mockResolvedValue({ error: null }),
      };

      createClientMock.mockReturnValue(supabaseMock as never);

      await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "frames-test-4",
          uploadedSlots: [buildSlot("left", 0, "frame-1")],
          couponCode: "FRAME50",
        }),
      });

      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          coupon_id: "coupon-frames",
          discount_amount: 20,
          total_price: 230,
        }),
      );
    });
  });

  describe("picture canvases", () => {
    function buildSlot(
      slotKey: "left" | "center" | "right",
      slotIndex: number,
      canvasId?: string | null,
    ) {
      return {
        slotIndex,
        slotKey,
        transformedUrl: `https://example.com/${slotKey}.jpg`,
        publicId: `public-${slotKey}`,
        secureUrl: `https://example.com/secure-${slotKey}.jpg`,
        ...(canvasId !== undefined ? { canvasId } : {}),
        transformations: {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
          brightness: 0,
          contrast: 0,
          grayscale: 0,
          blur: 0,
        },
        aiAdjustments: null,
      };
    }

    function setupCanvasesMocks(
      canvasRows: Array<{ id: string; name: string; price: number | string }>,
    ) {
      const { insert: orderInsert } = createInsertSelectSingle({
        data: {
          id: "order-canvases-1",
          order_number: "TI-2026-000300",
          status: "pending_payment",
        },
        error: null,
      });
      const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
      const historyInsert = vi.fn().mockResolvedValue({ error: null });

      const canvasesEq = vi.fn().mockResolvedValue({ data: canvasRows, error: null });
      const canvasesIn = vi.fn().mockReturnValue({ eq: canvasesEq });
      const canvasesSelect = vi.fn().mockReturnValue({ in: canvasesIn });

      mockSupabaseClient(createClientMock, {
        orders: {
          insert: orderInsert,
          select: vi.fn(),
          delete: vi.fn(),
        },
        order_items: {
          insert: orderItemsInsert,
        },
        order_status_history: {
          insert: historyInsert,
        },
        promotions: createPromotionsNoActiveMock(),
        picture_canvases: {
          select: canvasesSelect,
        },
      });

      return { orderInsert, orderItemsInsert, historyInsert };
    }

    it("adds canvas surcharge and snapshots canvas data on order items", async () => {
      const mocks = setupCanvasesMocks([
        { id: "canvas-1", name: "Classic Matte", price: "39.00" },
      ]);

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "canvases-test-1",
          uploadedSlots: [buildSlot("left", 0, "canvas-1")],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          total_price: 239,
        }),
      );
      expect(mocks.orderItemsInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          canvas_id: "canvas-1",
          canvas_name: "Classic Matte",
          canvas_price: 39,
        }),
      ]);
    });

    it("supports mixed canvas and plain slots alongside frames", async () => {
      const { insert: orderInsert } = createInsertSelectSingle({
        data: {
          id: "order-canvases-2",
          order_number: "TI-2026-000301",
          status: "pending_payment",
        },
        error: null,
      });
      const orderItemsInsert = vi.fn().mockResolvedValue({ error: null });
      const historyInsert = vi.fn().mockResolvedValue({ error: null });

      const framesEq = vi
        .fn()
        .mockResolvedValue({ data: [{ id: "frame-1", name: "Oak Classic", price: 49 }], error: null });
      const framesIn = vi.fn().mockReturnValue({ eq: framesEq });
      const framesSelect = vi.fn().mockReturnValue({ in: framesIn });

      const canvasesEq = vi
        .fn()
        .mockResolvedValue({ data: [{ id: "canvas-1", name: "Classic Matte", price: 39 }], error: null });
      const canvasesIn = vi.fn().mockReturnValue({ eq: canvasesEq });
      const canvasesSelect = vi.fn().mockReturnValue({ in: canvasesIn });

      mockSupabaseClient(createClientMock, {
        orders: {
          insert: orderInsert,
          select: vi.fn(),
          delete: vi.fn(),
        },
        order_items: {
          insert: orderItemsInsert,
        },
        order_status_history: {
          insert: historyInsert,
        },
        promotions: createPromotionsNoActiveMock(),
        picture_frames: {
          select: framesSelect,
        },
        picture_canvases: {
          select: canvasesSelect,
        },
      });

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "canvases-test-2",
          uploadedSlots: [
            { ...buildSlot("left", 0, "canvas-1"), frameId: "frame-1" },
            buildSlot("right", 2, null),
          ],
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(orderInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          items_count: 2,
          total_price: 488,
        }),
      );
      expect(orderItemsInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          slot_key: "left",
          frame_id: "frame-1",
          frame_price: 49,
          canvas_id: "canvas-1",
          canvas_price: 39,
        }),
        expect.objectContaining({
          slot_key: "right",
          frame_id: null,
          frame_price: 0,
          canvas_id: null,
          canvas_name: null,
          canvas_price: 0,
        }),
      ]);
    });

    it("rejects unavailable canvas ids with 400", async () => {
      setupCanvasesMocks([]);

      const response = await handler({
        httpMethod: "POST",
        body: JSON.stringify({
          customer: buildCustomer(),
          idempotencyKey: "canvases-test-3",
          uploadedSlots: [buildSlot("left", 0, "canvas-missing")],
        }),
      });

      expect(response.statusCode).toBe(400);
      expect(readBody(response)).toEqual({
        error: "Selected canvas is not available.",
      });
    });
  });
});
