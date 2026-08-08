import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockUseTable = vi.fn();

vi.mock("@refinedev/react-table", () => ({
  useTable: (...args: unknown[]) => mockUseTable(...args),
}));

vi.mock("@/components/refine-ui/data-table", () => ({
  DataTable: ({
    table,
    onRowClick,
  }: {
    table: { refineCore: { tableQuery: { data: { data: Array<Record<string, unknown>> } } } };
    onRowClick?: (row: Record<string, unknown>) => void;
  }) => {
    const rows = table.refineCore.tableQuery.data?.data ?? [];
    return (
      <table>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} data-testid="table-row" onClick={() => onRowClick?.(row)}>
              <td>{row.title as string}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

const mockTriggerBuild = vi.fn();
vi.mock("@/admin/lib/trigger-build", () => ({
  triggerBuild: () => mockTriggerBuild(),
}));

import { ContentListPage } from "./content-list";

const CONTENT = [
  {
    id: "c1",
    slug: "about",
    title: "O nas",
    subtitle: "",
    icon: "Building2",
    menu_section: "company",
    menu_order: 1,
    last_updated: "2025-02-01",
    is_published: true,
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function setupMocks() {
  mockUseTable.mockReturnValue({
    refineCore: {
      tableQuery: { data: { data: CONTENT, total: 1 } },
      currentPage: 1,
      setCurrentPage: vi.fn(),
      pageCount: 1,
      pageSize: 50,
      setPageSize: vi.fn(),
    },
  });
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/admin/content"]}>
      <Routes>
        <Route path="/admin/content" element={<ContentListPage />} />
        <Route path="/admin/content/:id/edit" element={<div>Edit</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ContentListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders content rows", () => {
    setupMocks();
    renderList();
    expect(screen.getByText("O nas")).toBeInTheDocument();
  });

  it("renders the trigger rebuild button", () => {
    setupMocks();
    renderList();
    expect(screen.getByText("Uruchom przebudowę")).toBeInTheDocument();
  });

  it("calls triggerBuild on rebuild button click", async () => {
    setupMocks();
    mockTriggerBuild.mockResolvedValue({ ok: true, statusCode: 200 });
    renderList();

    await userEvent.click(screen.getByText("Uruchom przebudowę"));

    await waitFor(() => {
      expect(mockTriggerBuild).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Przebudowa uruchomiona/)).toBeInTheDocument();
    });
  });

  it("shows an error when rebuild is not configured", async () => {
    setupMocks();
    mockTriggerBuild.mockResolvedValue({ ok: false, statusCode: 500 });
    renderList();

    await userEvent.click(screen.getByText("Uruchom przebudowę"));

    await waitFor(() => {
      expect(screen.getByText(/nie jest skonfigurowany/)).toBeInTheDocument();
    });
  });

  it("navigates to edit on row click", async () => {
    setupMocks();
    renderList();
    await userEvent.click(screen.getByTestId("table-row"));
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });
  });
});
