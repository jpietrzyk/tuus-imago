import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

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

import { AdminUsersPage } from "./admin-users-list";

const USERS = [
  {
    id: "u-1",
    email: "admin@example.com",
    full_name: "Admin User",
    phone: "+48123",
    is_admin: true,
    last_sign_in_at: "2025-01-15T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "u-2",
    email: "user@example.com",
    full_name: null,
    phone: null,
    is_admin: false,
    last_sign_in_at: null,
    created_at: "2024-06-01T00:00:00Z",
    updated_at: null,
  },
];

function setupMocks(users: Array<Record<string, unknown>> = USERS) {
  mockUseCustom.mockReturnValue({
    result: { data: users },
    query: { isFetching: false },
  });
}

function renderAdminUsers(isAdminFilter?: boolean) {
  return render(
    <MemoryRouter initialEntries={["/admin/users"]}>
      <Routes>
        <Route path="/admin/users" element={<AdminUsersPage isAdminFilter={isAdminFilter} />} />
        <Route path="/admin/users/:id" element={<div>User Show</div>} />
        <Route path="/admin/admins" element={<AdminUsersPage isAdminFilter={true} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user list with data", () => {
    setupMocks();
    renderAdminUsers();

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    setupMocks();
    renderAdminUsers();

    const searchInput = screen.getByPlaceholderText("Szukaj po emailu lub nazwie...");
    await userEvent.type(searchInput, "admin");

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
  });

  it("renders admin badges correctly", () => {
    setupMocks();
    renderAdminUsers();

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Użytkownik")).toBeInTheDocument();
  });

  it("renders pencil edit buttons for each user", () => {
    setupMocks();
    renderAdminUsers();

    const svgElements = document.querySelectorAll("svg.lucide-pencil");
    expect(svgElements.length).toBeGreaterThanOrEqual(2);
  });
});
