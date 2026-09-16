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
  DataTable: ({
    table,
    onRowClick,
  }: {
    table: {
      refineCore: {
        tableQuery: { data: { data: Array<Record<string, unknown>> } };
      };
    };
    onRowClick?: (row: Record<string, unknown>) => void;
  }) => {
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

import { ShippingListPage } from "./shipping-list";

const SHIPPING = [
  {
    id: "ship-1",
    name: "InPost Paczkomat",
    description: "Parcel locker",
    price: 12.5,
    currency: "PLN",
    delivery_time: "1-2 dni",
    free_shipping_threshold: 300,
    is_active: true,
    is_default: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: SHIPPING, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
}

function renderShippingList() {
  return render(
    <MemoryRouter initialEntries={["/admin/shipping"]}>
      <Routes>
        <Route path="/admin/shipping" element={<ShippingListPage />} />
        <Route path="/admin/shipping/:id" element={<div>Shipping Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ShippingListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders shipping list with data", () => {
    setupMocks();
    renderShippingList();

    expect(screen.getByText("InPost Paczkomat")).toBeInTheDocument();
  });

  it("renders new shipping button", () => {
    setupMocks();
    renderShippingList();

    expect(screen.getByText("Nowa metoda dostawy")).toBeInTheDocument();
  });

  it("renders search control", () => {
    setupMocks();
    renderShippingList();

    expect(screen.getByPlaceholderText("Szukaj kuriera...")).toBeInTheDocument();
  });

  it("navigates to shipping show on row click", async () => {
    setupMocks();
    renderShippingList();

    await userEvent.click(screen.getByTestId("table-row"));

    await waitFor(() => {
      expect(screen.getByText("Shipping Show")).toBeInTheDocument();
    });
  });

  it("queries the shipping_methods resource sorted by sort_order", () => {
    setupMocks();
    renderShippingList();

    expect(mockUseTable).toHaveBeenCalledWith(
      expect.objectContaining({
        refineCoreProps: expect.objectContaining({
          resource: "shipping_methods",
        }),
      }),
    );
  });
});
