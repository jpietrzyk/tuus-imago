import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockLogin = vi.fn();

vi.mock("@refinedev/core", () => ({
  useLogin: () => ({ mutate: mockLogin }),
}));

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import { AdminLoginPage } from "../login";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email/password form", () => {
    renderLogin();

    expect(screen.getByText("Tuus Imago Admin")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    renderLogin();

    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("calls login with email and password on form submit", async () => {
    mockLogin.mockImplementation((_creds, opts) => opts?.onSuccess?.());
    renderLogin();

    await userEvent.type(screen.getByLabelText("Email"), "admin@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");

    const submitButton = screen.getByText("Sign in");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: "admin@test.com", password: "password123" },
        expect.any(Object),
      );
    });
  });
});
