import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ComplaintListPage } from "./complaint-list";

const mockUseList = vi.fn();

vi.mock("@refinedev/core", () => ({
  useList: (...args: unknown[]) => mockUseList(...args),
}));

const COMPLAINTS = [
  {
    id: "c1",
    name: "John Doe",
    email: "john@example.com",
    order_number: "TI-2026-000001",
    complaint_type: "damaged",
    status: "new",
    created_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "c2",
    name: "Jane Smith",
    email: "jane@example.com",
    order_number: "TI-2026-000002",
    complaint_type: "quality",
    status: "resolved",
    created_at: "2026-09-02T10:00:00Z",
  },
];

function setupMocks(complaints: Array<Record<string, unknown>> = COMPLAINTS) {
  mockUseList.mockReturnValue({
    query: { isLoading: false },
    result: { data: complaints },
  });
}

function renderComplaintList() {
  return render(
    <MemoryRouter initialEntries={["/admin/complaints"]}>
      <Routes>
        <Route path="/admin/complaints" element={<ComplaintListPage />} />
        <Route path="/admin/complaints/:id" element={<div>Complaint Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ComplaintListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders complaint rows", () => {
    setupMocks();
    renderComplaintList();

    expect(screen.getByText("TI-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("TI-2026-000002")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    setupMocks([]);
    renderComplaintList();

    expect(screen.getByText("Brak reklamacji")).toBeInTheDocument();
  });
});
