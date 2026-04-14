import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RefEditPage } from "./ref-edit";

const mockUseOne = vi.fn();
const mockUseList = vi.fn();
const mockMutate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useList: (...args: unknown[]) => mockUseList(...args),
  useUpdate: () => ({ mutate: mockMutate }),
}));

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

function renderRefEdit(id = "ref-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/refs/${id}/edit`]}>
      <Routes>
        <Route path="/admin/refs/:id/edit" element={<RefEditPage />} />
        <Route path="/admin/refs/:id" element={<div>Ref Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RefEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders readonly ref_code field", () => {
    setupMocks();
    renderRefEdit();

    const codeInput = screen.getByDisplayValue("gallery-warsaw");
    expect(codeInput).toBeInTheDocument();
    expect(codeInput).toBeDisabled();
  });

  it("renders editable label field", () => {
    setupMocks();
    renderRefEdit();

    expect(screen.getByDisplayValue("Gallery Warsaw")).toBeInTheDocument();
  });

  it("calls updateRef on submit", async () => {
    setupMocks();
    mockMutate.mockImplementation((_, { onSuccess }) => onSuccess());
    renderRefEdit();

    const submitButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "partner_refs",
          id: "ref-1",
          values: expect.objectContaining({ label: "Gallery Warsaw" }),
        }),
        expect.any(Object),
      );
    });
  });
});
