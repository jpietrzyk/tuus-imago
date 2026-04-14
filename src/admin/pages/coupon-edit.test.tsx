import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CouponEditPage } from "./coupon-edit";

const mockUseOne = vi.fn();
const mockUseList = vi.fn();
const mockMutate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
  useUpdate: () => ({ mutate: mockMutate }),
}));

const COUPON = {
  id: "c-1",
  code: "SUMMER20",
  description: "Summer discount",
  discount_type: "percentage",
  discount_value: 20,
  currency: "PLN",
  min_order_amount: null,
  max_uses: 50,
  used_count: 10,
  valid_from: null,
  valid_until: null,
  is_active: true,
  partner_id: null,
  created_at: "2025-01-01T00:00:00Z",
};

function setupMocks(coupon: Record<string, unknown> | null = COUPON) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: coupon,
  });
  mockUseList.mockReturnValue({
    result: { data: [] },
  });
}

function renderCouponEdit(id = "c-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/coupons/${id}/edit`]}>
      <Routes>
        <Route path="/admin/coupons/:id/edit" element={<CouponEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CouponEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form pre-populated with coupon data", () => {
    setupMocks();
    renderCouponEdit();

    expect(screen.getByText("Edytuj kupon")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SUMMER20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "Used 10 times")).toBeInTheDocument();
  });

  it("calls updateCoupon on submit", async () => {
    setupMocks();
    mockMutate.mockImplementation((_, { onSuccess }) => onSuccess());
    renderCouponEdit();

    const submitButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "coupons",
          id: "c-1",
          values: expect.objectContaining({ code: "SUMMER20" }),
        }),
        expect.any(Object),
      );
    });
  });

  it("shows not found when coupon is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    mockUseList.mockReturnValue({ result: { data: [] } });
    renderCouponEdit("nonexistent");

    expect(screen.getByText("Coupon not found.")).toBeInTheDocument();
  });
});
