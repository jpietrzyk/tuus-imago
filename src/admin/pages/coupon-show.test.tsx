import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CouponShowPage } from "./coupon-show";

const mockUseOne = vi.fn();
const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
}));

const COUPON = {
  id: "c-1",
  code: "SUMMER20",
  description: "Summer discount",
  discount_type: "percentage",
  discount_value: 20,
  currency: "PLN",
  min_order_amount: 100,
  max_uses: 50,
  used_count: 10,
  valid_from: "2025-06-01T00:00:00Z",
  valid_until: "2025-08-31T23:59:59Z",
  is_active: true,
  partner_id: "p-1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
};

function setupMocks(coupon: Record<string, unknown> | null = COUPON) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: coupon,
  });
  mockUseList.mockReturnValue({
    result: { data: [{ id: "p-1", company_name: "Art Gallery" }] },
  });
}

function renderCouponShow(id = "c-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/coupons/${id}`]}>
      <Routes>
        <Route path="/admin/coupons/:id" element={<CouponShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CouponShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders coupon code and details", () => {
    setupMocks();
    renderCouponShow();

    expect(screen.getAllByText("SUMMER20").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Summer discount")).toBeInTheDocument();
    expect(screen.getByText("Art Gallery")).toBeInTheDocument();
  });

  it("renders discount as percentage", () => {
    setupMocks();
    renderCouponShow();

    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("10 / 50")).toBeInTheDocument();
  });

  it("renders fixed amount discount correctly", () => {
    setupMocks({
      ...COUPON,
      discount_type: "fixed_amount",
      discount_value: 25.5,
    });
    renderCouponShow();

    expect(screen.getByText("25.50 PLN")).toBeInTheDocument();
  });

  it("renders active status badge", () => {
    setupMocks();
    renderCouponShow();

    expect(screen.getAllByText("Aktywne").length).toBeGreaterThanOrEqual(1);
  });

  it("shows not found when coupon is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    mockUseList.mockReturnValue({ result: { data: [] } });
    renderCouponShow("nonexistent");

    expect(screen.getByText("Kupon nie znaleziony.")).toBeInTheDocument();
  });
});
