import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CustomerShowPage } from "./customer-show";

const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

const ORDERS = [
  {
    id: "ord-1",
    order_number: "ORD-001",
    status: "paid",
    total_price: 199,
    items_count: 1,
    payment_status: "verified",
    shipment_status: "delivered",
    shipping_address: "1 Main St",
    shipping_city: "Warsaw",
    shipping_postal_code: "00-001",
    shipping_country: "Poland",
    marketing_consent: true,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "ord-2",
    order_number: "ORD-002",
    status: "pending_payment",
    total_price: 398,
    items_count: 2,
    payment_status: "pending",
    shipment_status: "pending_fulfillment",
    shipping_address: "2 Oak Ave",
    shipping_city: "Krakow",
    shipping_postal_code: "30-001",
    shipping_country: "Poland",
    marketing_consent: false,
    created_at: "2025-01-10T10:00:00Z",
  },
];

function setupMocks(orders: Array<Record<string, unknown>> = ORDERS) {
  mockUseList.mockReturnValue({
    query: { isLoading: false },
    result: { data: orders },
  });
}

function renderCustomerShow(email = "john@example.com") {
  return render(
    <MemoryRouter initialEntries={[`/admin/customers/${encodeURIComponent(email)}`]}>
      <Routes>
        <Route path="/admin/customers/:email" element={<CustomerShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders customer email and stats", () => {
    setupMocks();
    renderCustomerShow();

    expect(screen.getAllByText("john@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-002")).toBeInTheDocument();
  });

  it("renders latest shipping address", () => {
    setupMocks();
    renderCustomerShow();

    expect(screen.getByText("1 Main St")).toBeInTheDocument();
  });

  it("shows not found when no orders", () => {
    setupMocks([]);
    renderCustomerShow("nobody@example.com");

    expect(screen.getByText(/nobody@example.com/)).toBeInTheDocument();
  });
});
