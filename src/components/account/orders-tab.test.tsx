import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OrdersTab } from "./orders-tab";
import type { CustomerOrder } from "@/lib/orders-api";

const mockNavigate = vi.fn();
const mockGetCustomerOrders = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock("@/lib/orders-api", () => ({
  getCustomerOrders: (...args: unknown[]) => mockGetCustomerOrders(...args),
}));

vi.mock("@/lib/image-transformations", () => ({
  getCloudinaryThumbnailUrl: (url: string, w: number, h: number) =>
    `thumb://${w}x${h}/${url}`,
}));

vi.mock("@/lib/pricing", () => ({
  formatPrice: (val: number) => `PRICE:${val}`,
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

const makeOrder = (overrides: Partial<CustomerOrder> = {}): CustomerOrder => ({
  id: "order-1",
  order_number: "ORD-001",
  status: "paid",
  customer_name: "Jane Doe",
  customer_email: "jane@example.com",
  shipping_address: "123 Main St",
  shipping_city: "Warsaw",
  shipping_postal_code: "00-001",
  shipping_country: "Poland",
  items_count: 2,
  unit_price: 50,
  total_price: 100,
  discount_amount: 0,
  coupon_code: null,
  payment_status: "verified",
  payment_provider: "p24",
  payment_paid_at: "2025-01-15T10:00:00Z",
  shipment_status: "pending",
  tracking_number: null,
  shipping_method: "courier",
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z",
  items: [
    {
      id: "item-1",
      slot_key: "front",
      slot_index: 0,
      transformed_url: "https://cdn.example.com/img1.jpg",
      transformations: {},
      ai_adjustments: null,
    },
    {
      id: "item-2",
      slot_key: "back",
      slot_index: 1,
      transformed_url: "https://cdn.example.com/img2.jpg",
      transformations: {},
      ai_adjustments: null,
    },
  ],
  ...overrides,
});

function renderWithRouter(initialPath = "/account/orders") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/account/orders" element={<OrdersTab />} />
        <Route path="/account/orders/:orderId" element={<OrdersTab />} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OrdersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
  });

  it("shows loading spinner initially", () => {
    mockGetCustomerOrders.mockReturnValue(new Promise(() => {}));
    renderWithRouter();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows error state with retry button when fetch fails", async () => {
    mockGetCustomerOrders.mockRejectedValue(new Error("fail"));
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("account.retry")).toBeInTheDocument();
    });

    expect(screen.getByText(/Could not load orders/)).toBeInTheDocument();
  });

  it("retries fetch on retry button click", async () => {
    const order = makeOrder();
    mockGetCustomerOrders
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ orders: [order] });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("account.retry")).toBeInTheDocument();
    });

    screen.getByText("account.retry").click();

    await waitFor(() => {
      expect(mockGetCustomerOrders).toHaveBeenCalledTimes(2);
    });
  });

  it("shows empty state when no orders", async () => {
    mockGetCustomerOrders.mockResolvedValue({ orders: [] });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("account.noOrders")).toBeInTheDocument();
    });

    expect(screen.getByText("account.startShopping")).toBeInTheDocument();
  });

  it("renders order list with status badges and prices", async () => {
    const order = makeOrder();
    mockGetCustomerOrders.mockResolvedValue({ orders: [order] });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("verified")).toBeInTheDocument();
    expect(screen.getByText("PRICE:100")).toBeInTheDocument();
  });

  it("navigates to order detail on card click", async () => {
    const order = makeOrder();
    mockGetCustomerOrders.mockResolvedValue({ orders: [order] });
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    screen.getByText("ORD-001").closest("[class]")?.click();

    expect(mockNavigate).toHaveBeenCalledWith("/account/orders/order-1");
  });

  it("shows order detail view with items and images", async () => {
    const order = makeOrder({
      tracking_number: "TRACK-123",
      discount_amount: 10,
    });
    mockGetCustomerOrders.mockResolvedValue({ orders: [order] });
    mockUseParams.mockReturnValue({ orderId: "order-1" });

    renderWithRouter("/account/orders/order-1");

    await waitFor(() => {
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });

    expect(screen.getByText("TRACK-123")).toBeInTheDocument();
    expect(screen.getByAltText("front")).toHaveAttribute(
      "src",
      "thumb://48x48/https://cdn.example.com/img1.jpg",
    );
    expect(screen.getByAltText("back")).toHaveAttribute(
      "src",
      "thumb://48x48/https://cdn.example.com/img2.jpg",
    );
    expect(screen.getByText("PRICE:100")).toBeInTheDocument();
    expect(screen.getByText(/account\.discount.*PRICE:10/)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/Warsaw/)).toBeInTheDocument();
    expect(screen.getByText("Poland")).toBeInTheDocument();
  });

  it("back button in detail view navigates back", async () => {
    const order = makeOrder();
    mockGetCustomerOrders.mockResolvedValue({ orders: [order] });
    mockUseParams.mockReturnValue({ orderId: "order-1" });

    const { container } = renderWithRouter("/account/orders/order-1");

    await waitFor(() => {
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });

    const backButton = container.querySelector("button");
    backButton?.click();

    expect(mockNavigate).toHaveBeenCalledWith("/account/orders");
  });
});
