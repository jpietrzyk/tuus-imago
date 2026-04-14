import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseTable = vi.fn();
const mockUseCustom = vi.fn();

vi.mock("@refinedev/react-table", () => ({
  useTable: (...args: unknown[]) => mockUseTable(...args),
}));

vi.mock("@refinedev/core", () => ({
  useCustom: (...args: unknown[]) => mockUseCustom(...args),
}));

vi.mock("@/components/refine-ui/data-table", () => ({
  DataTable: ({ table }: { table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } }; onRowClick: (row: Record<string, unknown>) => void }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row" onClick={() => onRowClick(row)}>
              <td>{row.company_name as string}</td>
              <td>{row.city as string}</td>
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

import { PartnerListPage } from "./partner-list";

const PARTNERS = [
  {
    id: "p-1",
    company_name: "Art Gallery",
    contact_name: "Jan Kowalski",
    city: "Warsaw",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "p-2",
    company_name: "Photo Studio",
    contact_name: null,
    city: null,
    is_active: false,
    created_at: "2025-01-02T00:00:00Z",
  },
];

const STATS = [
  {
    partner_id: "p-1",
    company_name: "Art Gallery",
    is_active: true,
    coupon_count: 3,
    ref_count: 2,
    total_orders: 15,
    total_revenue: 2985,
    last_order_date: "2025-01-15T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: PARTNERS, total: 2 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
  mockUseCustom.mockReturnValue({
    result: { data: STATS },
    query: { isFetching: false },
  });
}

function renderPartnerList() {
  return render(
    <MemoryRouter initialEntries={["/admin/partners"]}>
      <Routes>
        <Route path="/admin/partners" element={<PartnerListPage />} />
        <Route path="/admin/partners/:id" element={<div>Partner Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PartnerListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders partner list with data", () => {
    setupMocks();
    renderPartnerList();

    expect(screen.getByText("Art Gallery")).toBeInTheDocument();
    expect(screen.getByText("Photo Studio")).toBeInTheDocument();
  });

  it("renders export button and new partner button", () => {
    setupMocks();
    renderPartnerList();

    expect(screen.getByText("Eksportuj CSV")).toBeInTheDocument();
    expect(screen.getByText("Nowy partner")).toBeInTheDocument();
  });

  it("triggers CSV export on button click", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("company_name\nArt Gallery"),
    });
    renderPartnerList();

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

  it("calls useCustom with partner_stats aggregate function", () => {
    setupMocks();
    renderPartnerList();

    expect(mockUseCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          payload: expect.objectContaining({
            meta: expect.objectContaining({ aggregateFunction: "partner_stats" }),
          }),
        }),
      }),
    );
  });

  it("renders search input for company name", () => {
    setupMocks();
    renderPartnerList();

    expect(screen.getByPlaceholderText("Szukaj firmy...")).toBeInTheDocument();
  });
});
