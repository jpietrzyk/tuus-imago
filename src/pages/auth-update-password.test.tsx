import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UpdatePasswordPage } from "./auth-update-password";

const mockNavigate = vi.fn();
const mockUpdatePassword = vi.fn();

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ updatePassword: mockUpdatePassword }),
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <UpdatePasswordPage />
    </MemoryRouter>,
  );
}

describe("UpdatePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders password input with minLength=6 and submit button", () => {
    renderPage();
    const input = screen.getByLabelText("auth.newPassword");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("minLength", "6");
    expect(input).toBeRequired();
    expect(screen.getByRole("button", { name: "auth.updatePassword" })).toBeInTheDocument();
  });

  it("calls updatePassword with entered password on submit", async () => {
    mockUpdatePassword.mockResolvedValue(undefined);
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("auth.newPassword"), "secret123");
    await user.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith("secret123");
    });
  });

  it("shows success message after updating", async () => {
    mockUpdatePassword.mockResolvedValue(undefined);
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("auth.newPassword"), "secret123");
    await user.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await waitFor(() => {
      expect(screen.getByText("auth.passwordUpdated")).toBeInTheDocument();
    });
  });

  it("redirects to /account after 2 second timeout", async () => {
    vi.useFakeTimers();
    mockUpdatePassword.mockResolvedValue(undefined);
    renderPage();

    const input = screen.getByLabelText("auth.newPassword");
    fireEvent.change(input, { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("auth.passwordUpdated")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(mockNavigate).toHaveBeenCalledWith("/account", { replace: true });
  });

  it("shows error message when updatePassword rejects", async () => {
    mockUpdatePassword.mockRejectedValue(new Error("Network error"));
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("auth.newPassword"), "secret123");
    await user.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    });
  });

  it("shows loading state during submission", async () => {
    let resolve!: () => void;
    mockUpdatePassword.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("auth.newPassword"), "secret123");
    await user.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });

    resolve();

    await waitFor(() => {
      expect(screen.getByText("auth.passwordUpdated")).toBeInTheDocument();
    });
  });

  it("timeout fires after unmount without crash", async () => {
    vi.useFakeTimers();
    mockUpdatePassword.mockResolvedValue(undefined);
    const { unmount } = renderPage();

    const input = screen.getByLabelText("auth.newPassword");
    fireEvent.change(input, { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "auth.updatePassword" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("auth.passwordUpdated")).toBeInTheDocument();

    unmount();
    vi.advanceTimersByTime(2000);

    expect(mockNavigate).toHaveBeenCalledWith("/account", { replace: true });
  });
});
