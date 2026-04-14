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
  DataTable: ({ table }: { table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } } }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row">
              <td>{row.order_number as string}</td>
              <td>{row.customer_email as string}</td>
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

vi.mock("@/lib/image-transformations", () => ({
  getCloudinaryThumbnailUrl: vi.fn((url: string) => url),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { OrderListPage } from "./order-list";

const ORDERS = [
  {
    id: "ord-1",
    order_number: "ORD-001",
    status: "paid",
    customer_name: "John Doe",
    customer_email: "john@example.com",
    total_price: 199,
    items_count: 1,
    payment_status: "verified",
    shipment_status: "pending_fulfillment",
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "ord-2",
    order_number: "ORD-002",
    status: "pending_payment",
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    total_price: 398,
    items_count: 2,
    payment_status: "pending",
    shipment_status: "pending_fulfillment",
    created_at: "2025-01-14T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: ORDERS, total: 2 } },
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

function renderOrderList() {
  return render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <Routes>
        <Route path="/admin/orders" element={<OrderListPage />} />
        <Route path="/admin/orders/:id" element={<div>Order Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OrderListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders order list with data", () => {
    setupMocks();
    renderOrderList();

    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-002")).toBeInTheDocument();
  });

  it("renders search and filter controls", () => {
    setupMocks();
    renderOrderList();

    expect(screen.getByPlaceholderText("Szukaj po emailu...")).toBeInTheDocument();
  });

  it("renders export CSV button", () => {
    setupMocks();
    renderOrderList();

    expect(screen.getByText("Eksportuj CSV")).toBeInTheDocument();
  });

  it("triggers CSV export on button click", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("order_number,email\nORD-001,john@example.com"),
    });
    renderOrderList();

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
});
