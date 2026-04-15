import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OrderShowPage } from "./order-show";

const mockUseOne = vi.fn();
const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const ORDER_DETAIL = {
  id: "ord-1",
  order_number: "ORD-001",
  status: "pending_payment",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+48123456789",
  shipping_address: "1 Main St",
  shipping_city: "Warsaw",
  shipping_postal_code: "00-001",
  shipping_country: "Poland",
  shipping_method: "Standard",
  shipping_cost: 15,
  total_price: 214,
  unit_price: 199,
  items_count: 1,
  discount_amount: 0,
  coupon_code: null,
  payment_status: "pending",
  payment_provider: null,
  payment_paid_at: null,
  payment_verified_at: null,
  shipment_status: "pending_fulfillment",
  tracking_number: null,
  currency: "PLN",
  marketing_consent: true,
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
};

function setupMocks(order: Record<string, unknown> | null = ORDER_DETAIL) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: order,
  });

  mockUseList.mockImplementation(({ resource }: { resource: string }) => {
    if (resource === "order_items") {
      return {
        result: {
          data: [
            {
              id: "item-1",
              slot_key: "front",
              slot_index: 0,
              transformed_url: "https://res.cloudinary.com/demo/upload/front.jpg",
              public_id: "demo/front",
              secure_url: null,
              transformations: {},
              ai_adjustments: { enhance: true },
            },
          ],
        },
      };
    }
    if (resource === "order_status_history") {
      return {
        result: {
          data: [
            {
              id: "hist-1",
              status_type: "order",
              status: "pending_payment",
              note: "Order created",
              created_at: "2025-01-15T10:00:00Z",
            },
          ],
        },
      };
    }
    return { result: { data: [] } };
  });
}

function renderOrderShow(id = "ord-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/orders/${id}`]}>
      <Routes>
        <Route path="/admin/orders/:id" element={<OrderShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OrderShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders order details with all sections", () => {
    setupMocks();
    renderOrderShow();

    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("+48123456789")).toBeInTheDocument();
    expect(screen.getByText("1 Main St")).toBeInTheDocument();
    expect(screen.getByText(/Warsaw.*00-001/)).toBeInTheDocument();
  });

  it("renders order status transition buttons for pending_payment", () => {
    setupMocks();
    renderOrderShow();

    expect(screen.getByText(/Mark as Paid/)).toBeInTheDocument();
    expect(screen.getByText(/Mark as Cancelled/)).toBeInTheDocument();
  });

  it("renders shipment management section with tracking input", () => {
    setupMocks();
    renderOrderShow();

    expect(screen.getByText("Tracking Number")).toBeInTheDocument();
    expect(screen.getByText(/Mark as In Transit/)).toBeInTheDocument();
  });

  it("renders status history timeline", () => {
    setupMocks();
    renderOrderShow();

    expect(screen.getByText("Status History")).toBeInTheDocument();
    expect(screen.getByText("order")).toBeInTheDocument();
    expect(screen.getByText("pending payment")).toBeInTheDocument();
    expect(screen.getByText("Order created")).toBeInTheDocument();
  });

  it("renders order items with AI adjustments", () => {
    setupMocks();
    renderOrderShow();

    expect(screen.getByText(/front.*Slot 1/)).toBeInTheDocument();
    expect(screen.getByText("Enhanced")).toBeInTheDocument();
  });

  it("shows not found when order is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    mockUseList.mockReturnValue({ result: { data: [] } });
    renderOrderShow("nonexistent");

    expect(screen.getByText("Order not found.")).toBeInTheDocument();
  });

  it("sends PATCH request on order status update", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    renderOrderShow();

    const paidButton = screen.getByText(/Mark as Paid/);
    await userEvent.click(paidButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"status":"paid"'),
        }),
      );
    });
  });

  it("shows loading spinner while fetching", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: true },
      result: null,
    });
    mockUseList.mockReturnValue({ result: { data: [] } });
    renderOrderShow();

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("sends shipment update with tracking number", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    renderOrderShow();

    const trackingInput = screen.getByPlaceholderText("Enter tracking number");
    await userEvent.type(trackingInput, "TRACK123");

    const inTransitButton = screen.getByText(/Mark as In Transit/);
    await userEvent.click(inTransitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"shipment_status":"in_transit"'),
        }),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          body: expect.stringContaining('"tracking_number":"TRACK123"'),
        }),
      );
    });
  });

  it("shows different shipment buttons for in_transit status", () => {
    setupMocks({
      ...ORDER_DETAIL,
      shipment_status: "in_transit",
    });
    renderOrderShow();

    expect(screen.getByText(/Mark as Delivered/)).toBeInTheDocument();
    expect(screen.getByText(/Mark as Failed Delivery/)).toBeInTheDocument();
    expect(screen.getByText(/Mark as Returned/)).toBeInTheDocument();
    expect(screen.queryByText(/Mark as In Transit/)).not.toBeInTheDocument();
  });

  it("opens image preview dialog on Preview button click", async () => {
    setupMocks();
    renderOrderShow();

    const previewButtons = screen.getAllByText("Preview");
    await userEvent.click(previewButtons[0]);

    expect(screen.getByText("Slot 1 of 1")).toBeInTheDocument();
  });
});
