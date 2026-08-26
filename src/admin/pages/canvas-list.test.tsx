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

import { CanvasListPage } from "./canvas-list";

const CANVASES = [
  {
    id: "canvas-1",
    name: "Classic Matte",
    description: "Matte cotton canvas",
    price: 39,
    currency: "PLN",
    image_url: null,
    color: "#f5f0e6",
    material: "cotton",
    is_active: true,
    is_default: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: CANVASES, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
}

function renderCanvasList() {
  return render(
    <MemoryRouter initialEntries={["/admin/canvases"]}>
      <Routes>
        <Route path="/admin/canvases" element={<CanvasListPage />} />
        <Route path="/admin/canvases/:id" element={<div>Canvas Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CanvasListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders canvas list with data", () => {
    setupMocks();
    renderCanvasList();

    expect(screen.getByText("Classic Matte")).toBeInTheDocument();
  });

  it("renders new canvas button", () => {
    setupMocks();
    renderCanvasList();

    expect(screen.getByText("Nowe płótno")).toBeInTheDocument();
  });

  it("renders search control", () => {
    setupMocks();
    renderCanvasList();

    expect(screen.getByPlaceholderText("Szukaj nazwy...")).toBeInTheDocument();
  });

  it("navigates to canvas show on row click", async () => {
    setupMocks();
    renderCanvasList();

    await userEvent.click(screen.getByTestId("table-row"));

    await waitFor(() => {
      expect(screen.getByText("Canvas Show")).toBeInTheDocument();
    });
  });
});
