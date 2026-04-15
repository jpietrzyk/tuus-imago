import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseOne = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { PromotionShowPage } from "./promotion-show";

const PROMOTION = {
  id: "promo-1",
  name: "Spring Sale",
  slogan: "Spring Sale -20%!",
  discount_type: "percentage",
  discount_value: 20,
  currency: "PLN",
  min_order_amount: null,
  min_slots: 2,
  valid_from: null,
  valid_until: "2026-08-31T23:59:59Z",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

function setupMocks(promotion: Record<string, unknown> | null = PROMOTION) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: promotion,
    invalidate: vi.fn(),
  });
}

function renderPromotionShow(id = "promo-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/promotions/${id}`]}>
      <Routes>
        <Route path="/admin/promotions/:id" element={<PromotionShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PromotionShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders promotion name and slogan", () => {
    setupMocks();
    renderPromotionShow();

    expect(screen.getAllByText("Spring Sale").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Spring Sale -20%!")).toBeInTheDocument();
  });

  it("renders discount as percentage", () => {
    setupMocks();
    renderPromotionShow();

    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("renders fixed amount discount correctly", () => {
    setupMocks({
      ...PROMOTION,
      discount_type: "fixed_amount",
      discount_value: 49.99,
    });
    renderPromotionShow();

    expect(screen.getByText("49.99 PLN")).toBeInTheDocument();
  });

  it("renders min_slots condition", () => {
    setupMocks();
    renderPromotionShow();

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders active status badge", () => {
    setupMocks();
    renderPromotionShow();

    expect(screen.getAllByText("Aktywna").length).toBeGreaterThanOrEqual(1);
  });

  it("renders inactive status badge", () => {
    setupMocks({ ...PROMOTION, is_active: false });
    renderPromotionShow();

    expect(screen.getAllByText("Nieaktywna").length).toBeGreaterThanOrEqual(1);
  });

  it("shows not found when promotion is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
      invalidate: vi.fn(),
    });
    renderPromotionShow("nonexistent");

    expect(screen.getByText("Promocja nie znaleziona.")).toBeInTheDocument();
  });

  it("renders activate button for inactive promotion", () => {
    setupMocks({ ...PROMOTION, is_active: false });
    renderPromotionShow();

    expect(screen.getByText("Aktywuj")).toBeInTheDocument();
  });

  it("renders deactivate button for active promotion", () => {
    setupMocks();
    renderPromotionShow();

    expect(screen.getByText("Dezaktywuj")).toBeInTheDocument();
  });
});
