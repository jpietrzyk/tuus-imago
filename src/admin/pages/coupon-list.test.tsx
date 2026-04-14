import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseTable = vi.fn();
const mockUseList = vi.fn();

vi.mock("@refinedev/react-table", () => ({
  useTable: (...args: unknown[]) => mockUseTable(...args),
}));

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

vi.mock("@/components/refine-ui/data-table", () => ({
  DataTable: ({ table }: { table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } }; onRowClick: (row: Record<string, unknown>) => void }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row" onClick={() => onRowClick(row)}>
              <td>{row.code as string}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

import { CouponListPage } from "./coupon-list";

const COUPONS = [
  {
    id: "c-1",
    code: "SUMMER20",
    description: "Summer discount",
    discount_type: "percentage",
    discount_value: 20,
    min_order_amount: null,
    max_uses: 50,
    used_count: 10,
    valid_from: null,
    valid_until: null,
    is_active: true,
    partner_id: null,
    created_at: "2025-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: COUPONS, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
  mockUseList.mockReturnValue({
    result: { data: [] },
  });
}

function renderCouponList() {
  return render(
    <MemoryRouter initialEntries={["/admin/coupons"]}>
      <Routes>
        <Route path="/admin/coupons" element={<CouponListPage />} />
        <Route path="/admin/coupons/:id" element={<div>Coupon Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CouponListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders coupon list with data", () => {
    setupMocks();
    renderCouponList();

    expect(screen.getByText("SUMMER20")).toBeInTheDocument();
  });

  it("renders new coupon button", () => {
    setupMocks();
    renderCouponList();

    expect(screen.getByText("Nowy kupon")).toBeInTheDocument();
  });

  it("renders search and filter controls", () => {
    setupMocks();
    renderCouponList();

    expect(screen.getByPlaceholderText("Szukaj kodu...")).toBeInTheDocument();
  });
});
