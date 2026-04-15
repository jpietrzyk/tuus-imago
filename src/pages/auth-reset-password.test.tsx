import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ResetPasswordPage } from "@/pages/auth-reset-password";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";

const mockResetPassword = vi.fn();
const mockNavigate = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

const noop = vi.fn();
const mockAuthValue = {
  user: null,
  session: null,
  loading: false,
  signUp: noop,
  signIn: noop,
  signOut: noop,
  signInWithOAuth: noop,
  signInWithOtp: noop,
  resetPassword: noop,
  updatePassword: noop,
};

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    ...mockAuthValue,
    resetPassword: mockResetPassword,
  });
  vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  mockResetPassword.mockReset();
  mockNavigate.mockReset();
});

describe("ResetPasswordPage", () => {
  it("renders email input and submit button", () => {
    renderPage();
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auth.sendResetLink" })).toBeInTheDocument();
  });

  it("calls resetPassword with entered email on submit", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderPage();

    await user.type(screen.getByLabelText("auth.email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "auth.sendResetLink" }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("shows success confirmation after sending", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderPage();

    await user.type(screen.getByLabelText("auth.email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "auth.sendResetLink" }));

    await waitFor(() => {
      expect(screen.getByText("auth.resetPasswordSent")).toBeInTheDocument();
    });
  });

  it("shows error message when resetPassword rejects", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(new Error("Network error"));
    renderPage();

    await user.type(screen.getByLabelText("auth.email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "auth.sendResetLink" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    mockResetPassword.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    renderPage();

    await user.type(screen.getByLabelText("auth.email"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "auth.sendResetLink" }));

    expect(screen.getByRole("button", { name: "auth.sendResetLink" })).toBeDisabled();

    resolve();
    await waitFor(() => {
      expect(screen.getByText("auth.resetPasswordSent")).toBeInTheDocument();
    });
  });

  it("back button navigates to /auth", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /auth\.backToSignIn/ }));

    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });
});
