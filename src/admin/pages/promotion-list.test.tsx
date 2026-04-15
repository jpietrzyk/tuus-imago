import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseTable = vi.fn();

vi.mock("@refinedev/react-table", () => ({
  useTable: (...args: unknown[]) => mockUseTable(...args),
}));

vi.mock("@refinedev/core", () => ({
  useList: vi.fn(),
}));

vi.mock("@/components/refine-ui/data-table", () => ({
  DataTable: ({ table, onRowClick }: { table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } }; onRowClick?: (row: Record<string, unknown>) => void }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row" onClick={() => onRowClick?.(row)}>
              <td>{row.name as string}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { PromotionListPage } from "./promotion-list";

const PROMOTIONS = [
  {
    id: "promo-1",
    name: "Spring Sale",
    slogan: "Spring Sale -20%!",
    discount_type: "percentage",
    discount_value: 20,
    min_order_amount: null,
    min_slots: null,
    valid_from: null,
    valid_until: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: PROMOTIONS, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
}

function renderPromotionList() {
  return render(
    <MemoryRouter initialEntries={["/admin/promotions"]}>
      <Routes>
        <Route path="/admin/promotions" element={<PromotionListPage />} />
        <Route path="/admin/promotions/:id" element={<div>Promotion Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PromotionListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders promotion list with data", () => {
    setupMocks();
    renderPromotionList();

    expect(screen.getByText("Spring Sale")).toBeInTheDocument();
  });

  it("renders new promotion button", () => {
    setupMocks();
    renderPromotionList();

    expect(screen.getByText("Nowa promocja")).toBeInTheDocument();
  });

  it("renders search control", () => {
    setupMocks();
    renderPromotionList();

    expect(screen.getByPlaceholderText("Szukaj nazwy...")).toBeInTheDocument();
  });

  it("renders CSV export button", () => {
    setupMocks();
    renderPromotionList();

    expect(screen.getByText("Eksportuj CSV")).toBeInTheDocument();
  });

  it("triggers CSV export on button click", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("name\nSpring Sale"),
    });
    renderPromotionList();

    const exportButton = screen.getByText("Eksportuj CSV");
    await userEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"export":true'),
        }),
      );
    });
  });

  it("renders active filter", () => {
    setupMocks();
    renderPromotionList();

    expect(screen.getByText("Wszystkie statusy")).toBeInTheDocument();
  });
});
