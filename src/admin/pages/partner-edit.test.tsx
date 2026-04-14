import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PartnerEditPage } from "./partner-edit";

const mockUseOne = vi.fn();
const mockMutate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useOne: (...args: unknown[]) => mockUseOne(...args),
  useUpdate: () => ({ mutate: mockMutate }),
}));

const PARTNER = {
  id: "p-1",
  company_name: "Art Gallery",
  contact_name: "Jan Kowalski",
  nip: "1234567890",
  contact_email: "art@gallery.com",
  phone: "+48123456789",
  city: "Warsaw",
  address: "ul. Artystów 5",
  notes: "VIP partner",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
};

function setupMocks(partner: Record<string, unknown> | null = PARTNER) {
  mockUseOne.mockReturnValue({
    query: { isFetching: false },
    result: partner,
  });
}

function renderPartnerEdit(id = "p-1") {
  return render(
    <MemoryRouter initialEntries={[`/admin/partners/${id}/edit`]}>
      <Routes>
        <Route path="/admin/partners/:id/edit" element={<PartnerEditPage />} />
        <Route path="/admin/partners/:id" element={<div>Partner Show</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PartnerEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form pre-populated with partner data", () => {
    setupMocks();
    renderPartnerEdit();

    expect(screen.getByText("Edytuj partnera")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Art Gallery")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Warsaw")).toBeInTheDocument();
    expect(screen.getByDisplayValue("VIP partner")).toBeInTheDocument();
  });

  it("calls updatePartner on submit", async () => {
    setupMocks();
    mockMutate.mockImplementation((_, { onSuccess }) => onSuccess());
    renderPartnerEdit();

    const submitButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "partners",
          id: "p-1",
          values: expect.objectContaining({ company_name: "Art Gallery" }),
        }),
        expect.any(Object),
      );
    });
  });

  it("shows not found when partner is null", () => {
    mockUseOne.mockReturnValue({
      query: { isFetching: false },
      result: null,
    });
    renderPartnerEdit("nonexistent");

    expect(screen.getByText("Partner not found.")).toBeInTheDocument();
  });
});
