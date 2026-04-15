import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseOne = vi.fn();
const mockUseUpdate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useUpdate: () => ({ mutate: mockUseUpdate }),
}));

import { PromotionEditPage } from "./promotion-edit";

const PROMOTION = {
  id: "promo-1",
  name: "Spring Sale",
  slogan: "Spring Sale -20%!",
  discount_type: "percentage",
  discount_value: 20,
  currency: "PLN",
  min_order_amount: null,
  min_slots: null,
  valid_from: null,
  valid_until: null,
  is_active: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function setupMocks(promotion: Record<string, unknown> | null = PROMOTION) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: promotion,
  });
}

function renderPromotionEdit(id = "promo-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/promotions/${id}/edit`]}>
      <Routes>
        <Route path="/admin/promotions/:id/edit" element={<PromotionEditPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PromotionEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders edit form with pre-filled data", () => {
    setupMocks();
    renderPromotionEdit();

    expect(screen.getByText("Edytuj promocję")).toBeInTheDocument();
    expect(screen.getByLabelText("Nazwa")).toHaveValue("Spring Sale");
    expect(screen.getByLabelText("Slogan")).toHaveValue("Spring Sale -20%!");
  });

  it("shows inactive badge for inactive promotion", () => {
    setupMocks();
    renderPromotionEdit();

    expect(screen.getByText("Nieaktywna")).toBeInTheDocument();
  });

  it("shows active badge for active promotion", () => {
    setupMocks({ ...PROMOTION, is_active: true });
    renderPromotionEdit();

    expect(screen.getByText("Aktywna")).toBeInTheDocument();
  });

  it("shows not found when promotion is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    renderPromotionEdit("nonexistent");

    expect(screen.getByText("Promocja nie znaleziona.")).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    setupMocks();
    renderPromotionEdit();

    expect(screen.getByLabelText("Nazwa")).toBeInTheDocument();
    expect(screen.getByLabelText("Slogan")).toBeInTheDocument();
    expect(screen.getByLabelText("Wartość rabatu")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimalna liczba slotów")).toBeInTheDocument();
    expect(screen.getByText("Zapisz zmiany")).toBeInTheDocument();
  });
});
