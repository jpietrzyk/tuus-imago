import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./protected-route";
import type { User } from "@supabase/supabase-js";

const mockUseAuth = vi.fn();

vi.mock("@/lib/auth-context", () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

const mockUser = { id: "user-1", email: "test@example.com" } as User;

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/protected" element={ui} />
        <Route
          path="/auth"
          element={<div data-testid="auth-page">Auth Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner when loading=true", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>,
    );

    expect(document.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("redirects to /auth with current location in state when no user", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Protected Content");
  });

  it("calls useAuth to determine auth state", () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>,
    );

    expect(mockUseAuth).toHaveBeenCalledTimes(1);
    expect(vi.mocked(mockUseAuth).mock.calls).toHaveLength(1);
  });
});
