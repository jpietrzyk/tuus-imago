import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseTable = vi.fn();
const mockUseList = vi.fn();
const mockCreateRef = vi.fn();
const mockDeleteRef = vi.fn();

vi.mock("@refinedev/react-table", () => ({
  useTable: (...args: unknown[]) => mockUseTable(...args),
}));

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
  useCreate: () => ({ mutateAsync: mockCreateRef }),
  useDelete: () => ({ mutateAsync: mockDeleteRef }),
}));

vi.mock("@/components/refine-ui/data-table", () => ({
  DataTable: ({ table }: { table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } }; onRowClick: (row: Record<string, unknown>) => void }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row" onClick={() => onRowClick(row)}>
              <td>{row.ref_code as string}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

vi.mock("@/admin/components/ref-qr-code-dialog", () => ({
  RefQrCodeDialog: ({ refCode }: { refCode: string }) => (
    <div data-testid="qr-dialog">QR for {refCode}</div>
  ),
}));

import { RefListPage } from "./ref-list";

const REFS = [
  {
    id: "ref-1",
    partner_id: "p-1",
    ref_code: "gallery-warsaw",
    label: "Gallery Warsaw",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: REFS, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
    },
  });
  mockUseList.mockReturnValue({
    result: { data: [{ id: "p-1", company_name: "Art Gallery" }] },
  });
}

function renderRefList() {
  return render(
    <MemoryRouter initialEntries={["/admin/refs"]}>
      <Routes>
        <Route path="/admin/refs" element={<RefListPage />} />
        <Route path="/admin/refs/:id" element={<div>Ref Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RefListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ref list with data", () => {
    setupMocks();
    renderRefList();

    expect(screen.getByText("gallery-warsaw")).toBeInTheDocument();
  });

  it("renders create ref button", () => {
    setupMocks();
    renderRefList();

    expect(screen.getByText("Nowy kod polecenia")).toBeInTheDocument();
  });

  it("opens create dialog on button click", async () => {
    setupMocks();
    mockCreateRef.mockResolvedValueOnce({});
    renderRefList();

    const createButton = screen.getByText("Nowy kod polecenia");
    await userEvent.click(createButton);

    expect(screen.getByText("Utwórz kod polecenia")).toBeInTheDocument();
  });
});
