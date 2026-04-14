import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminUserShowPage } from "./admin-user-show";

const mockUseCustom = vi.fn();
const mockUseUpdate = vi.fn();

vi.mock("@refinedev/core", () => ({
  useCustom: (...args: unknown[]) => mockUseCustom(...args),
  useUpdate: () => ({ mutate: mockUseUpdate }),
}));

vi.mock("@/admin/lib/get-auth-headers", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer test" }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const USER = {
  id: "user-1",
  email: "admin@example.com",
  full_name: "Admin User",
  phone: "+48123456789",
  is_admin: true,
  last_sign_in_at: "2025-01-15T10:00:00Z",
  created_at: "2024-06-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

function setupMocks(users: Array<Record<string, unknown>> = [USER]) {
  mockUseCustom.mockReturnValue({
    result: { data: users },
    query: { isLoading: false },
  });
}

function renderUserShow(id = "user-1") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/admin/users/${id}`, state: { from: "/admin/users" } }]}>
      <Routes>
        <Route path="/admin/users/:id" element={<AdminUserShowPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminUserShowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user details", () => {
    setupMocks();
    renderUserShow();

    expect(screen.getAllByText("admin@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("+48123456789")).toBeInTheDocument();
  });

  it("enters edit mode and saves changes", async () => {
    setupMocks();
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    renderUserShow();

    const editButton = screen.getByText("Edytuj użytkownika");
    await userEvent.click(editButton);

    const nameInput = screen.getByDisplayValue("Admin User");
    expect(nameInput).toBeInTheDocument();

    const saveButton = screen.getByText("Zapisz zmiany");
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/.netlify/functions/admin-api",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("shows not found for missing user", () => {
    setupMocks([]);
    renderUserShow("nonexistent");

    expect(screen.getByText("Użytkownik nie znaleziony.")).toBeInTheDocument();
  });
});
