import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PartnerCreatePage } from "./partner-create";

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function renderPartnerCreate() {
  return render(
    <MemoryRouter initialEntries={["/admin/partners/new"]}>
      <Routes>
        <Route path="/admin/partners/new" element={<PartnerCreatePage />} />
        <Route path="/admin/partners" element={<div>Partners List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PartnerCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form with all fields", () => {
    renderPartnerCreate();

    expect(screen.getByText("Nowy partner")).toBeInTheDocument();
    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact Name")).toBeInTheDocument();
    expect(screen.getByLabelText("NIP (Tax ID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("submits form with correct payload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { id: "new" } }) });
    renderPartnerCreate();

    await userEvent.type(screen.getByLabelText("Company Name"), "Art Gallery");
    await userEvent.type(screen.getByLabelText("Contact Name"), "Jan Kowalski");
    await userEvent.type(screen.getByLabelText("City"), "Warsaw");

    const submitButton = screen.getByText("Utwórz partnera");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"company_name":"Art Gallery"'),
        }),
      );
    });
  });

  it("shows error on failed creation", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Server error" }) });
    renderPartnerCreate();

    await userEvent.type(screen.getByLabelText("Company Name"), "Test");

    const submitButton = screen.getByText("Utwórz partnera");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
