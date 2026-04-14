import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockGetIdentity = vi.fn();
const mockLogout = vi.fn();

vi.mock("@refinedev/core", () => ({
  useGetIdentity: () => mockGetIdentity(),
  useLogout: () => ({ mutate: mockLogout }),
}));

import { AdminLayout } from "./layout";
import { tr } from "@/test/i18n-test";

function renderLayout(path = "/admin") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Dashboard Content</div>} />
        </Route>
        <Route path="/admin/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdentity.mockReturnValue({ data: { id: "1", email: "admin@test.com", name: "Admin" } });
    mockLogout.mockImplementation((_args, opts) => opts?.onSuccess?.());
  });

  it("renders sidebar navigation items", () => {
    renderLayout();

    expect(screen.getByText("Tuus Imago")).toBeInTheDocument();
    expect(screen.getByText(tr("admin.navigation.dashboard"))).toBeInTheDocument();
    expect(screen.getByText(tr("admin.navigation.orders"))).toBeInTheDocument();
    expect(screen.getByText(tr("admin.navigation.coupons"))).toBeInTheDocument();
    expect(screen.getByText(tr("admin.navigation.partners"))).toBeInTheDocument();
  });

  it("renders identity name in sidebar", () => {
    renderLayout();

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("calls logout on sign out button click", async () => {
    renderLayout();

    const signOutButton = screen.getByText(tr("admin.navigation.signOut"));
    await userEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalled();
  });
});
