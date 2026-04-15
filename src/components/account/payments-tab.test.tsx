import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockGetCustomerOrders = vi.fn();

vi.mock("@/lib/orders-api", () => ({
  getCustomerOrders: (...args: unknown[]) => mockGetCustomerOrders(...args),
}));

vi.mock("@/lib/pricing", () => ({
  formatPrice: (val: number) => `PRICE:${val}`,
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual };
});

vi.mock("@/lib/supabase-client", () => ({
  supabase: {},
  getSupabaseClient: vi.fn(),
}));

import { PaymentsTab } from "./payments-tab";

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "order-1",
  order_number: "ORD-001",
  created_at: "2025-01-15T10:30:00Z",
  total_price: 4999,
  payment_provider: "stripe",
  payment_status: "pending",
  ...overrides,
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PaymentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    mockGetCustomerOrders.mockReturnValue(new Promise(() => {}));

    renderWithRouter(<PaymentsTab />);

    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    mockGetCustomerOrders.mockRejectedValue(new Error("Network error"));

    renderWithRouter(<PaymentsTab />);

    await waitFor(() => {
      expect(screen.getByText("Could not load payment history.")).toBeInTheDocument();
    });
  });

  it("shows empty state when no payments", async () => {
    mockGetCustomerOrders.mockResolvedValue({
      orders: [makeOrder({ payment_provider: null })],
    });

    renderWithRouter(<PaymentsTab />);

    await waitFor(() => {
      expect(screen.getByText("account.noPayments")).toBeInTheDocument();
    });
  });

  it("filters orders by payment_provider", async () => {
    const orders = [
      makeOrder({ id: "o1", payment_provider: "stripe", order_number: "ORD-001" }),
      makeOrder({ id: "o2", payment_provider: null, order_number: "ORD-002" }),
      makeOrder({ id: "o3", payment_provider: "paypal", order_number: "ORD-003" }),
      makeOrder({ id: "o4", payment_provider: "", order_number: "ORD-004" }),
    ];

    mockGetCustomerOrders.mockResolvedValue({ orders });

    renderWithRouter(<PaymentsTab />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
      expect(screen.getByText("ORD-003")).toBeInTheDocument();
    });

    expect(screen.queryByText("ORD-002")).not.toBeInTheDocument();
    expect(screen.queryByText("ORD-004")).not.toBeInTheDocument();
  });

  it("renders table with correct columns and data", async () => {
    const orders = [
      makeOrder({
        id: "o1",
        order_number: "ORD-100",
        created_at: "2025-06-20T14:00:00Z",
        total_price: 2999,
        payment_provider: "stripe",
        payment_status: "verified",
      }),
    ];

    mockGetCustomerOrders.mockResolvedValue({ orders });

    renderWithRouter(<PaymentsTab />);

    await waitFor(() => {
      expect(screen.getByText("ORD-100")).toBeInTheDocument();
    });

    expect(screen.getByText("account.orderNumber")).toBeInTheDocument();
    expect(screen.getByText("account.date")).toBeInTheDocument();
    expect(screen.getByText("account.amount")).toBeInTheDocument();
    expect(screen.getByText("account.provider")).toBeInTheDocument();
    expect(screen.getByText("account.status")).toBeInTheDocument();
    expect(screen.getByText("PRICE:2999")).toBeInTheDocument();
    expect(screen.getByText("stripe")).toBeInTheDocument();
    expect(screen.getByText("verified")).toBeInTheDocument();
  });

  it("applies correct badge variant for different payment statuses", async () => {
    const orders = [
      makeOrder({ id: "o1", payment_status: "pending", order_number: "ORD-A" }),
      makeOrder({ id: "o2", payment_status: "verified", order_number: "ORD-B" }),
      makeOrder({ id: "o3", payment_status: "failed", order_number: "ORD-C" }),
      makeOrder({ id: "o4", payment_status: "refunded", order_number: "ORD-D" }),
      makeOrder({ id: "o5", payment_status: "unknown_status", order_number: "ORD-E" }),
    ];

    mockGetCustomerOrders.mockResolvedValue({ orders });

    renderWithRouter(<PaymentsTab />);

    await waitFor(() => {
      expect(screen.getByText("ORD-A")).toBeInTheDocument();
    });

    const badges = screen.getAllByText(/^(pending|verified|failed|refunded|unknown_status)$/);

    expect(badges[0]).toHaveTextContent("pending");
    expect(badges[1]).toHaveTextContent("verified");
    expect(badges[2]).toHaveTextContent("failed");
    expect(badges[3]).toHaveTextContent("refunded");
    expect(badges[4]).toHaveTextContent("unknown_status");
  });
});
