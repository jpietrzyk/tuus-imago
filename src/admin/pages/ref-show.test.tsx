import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseOne = vi.fn();
const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
}));

vi.mock("@/admin/components/ref-qr-code-dialog", () => ({
  RefQrCodeDialog: ({ refCode }: { refCode: string }) => (
    <div data-testid="qr-dialog">QR for {refCode}</div>
  ),
}));

import { RefShowPage } from "./ref-show";

const REF = {
  id: "ref-1",
  partner_id: "p-1",
  ref_code: "gallery-warsaw",
  label: "Gallery Warsaw",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

function setupMocks(ref: Record<string, unknown> | null = REF) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: ref,
  });
  mockUseList.mockReturnValue({
    result: { data: [{ id: "p-1", company_name: "Art Gallery" }] },
  });
}

function renderRefShow(id = "ref-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/refs/${id}`]}>
      <Routes>
        <Route path="/admin/refs/:id" element={<RefShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RefShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ref code and details", () => {
    setupMocks();
    renderRefShow();

    expect(screen.getAllByText("gallery-warsaw").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Gallery Warsaw").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Art Gallery")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    setupMocks();
    renderRefShow();

    expect(screen.getAllByText("Aktywne").length).toBeGreaterThanOrEqual(1);
  });

  it("shows not found when ref is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    mockUseList.mockReturnValue({ result: { data: [] } });
    renderRefShow("nonexistent");

    expect(screen.getByText("Nie znaleziono kodu polecenia.")).toBeInTheDocument();
  });
});
