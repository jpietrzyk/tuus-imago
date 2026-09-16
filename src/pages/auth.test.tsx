import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthPage } from "./auth";

const mockNavigate = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInWithOtp = vi.fn();

vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithOAuth: mockSignInWithOAuth,
    signInWithOtp: mockSignInWithOtp,
  }),
}));

vi.mock("@/lib/post-auth-redirect", () => ({
  POST_AUTH_REDIRECT_KEY: "post-auth-redirect",
  setPostAuthRedirect: (path: string) =>
    sessionStorage.setItem("post-auth-redirect", path),
  clearPostAuthRedirect: () =>
    sessionStorage.removeItem("post-auth-redirect"),
}));

vi.mock("@/locales/i18n", () => ({
  t: (key: string) => key,
}));

function renderWithRouter(
  initialPath = "/auth",
  state?: unknown,
  search = "",
) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: initialPath, search, state }]}
    >
      <AuthPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockSignIn.mockResolvedValue(undefined);
  mockSignUp.mockResolvedValue(undefined);
  mockSignInWithOAuth.mockResolvedValue(undefined);
  mockSignInWithOtp.mockResolvedValue(undefined);
});

describe("AuthPage", () => {
  it("renders sign-in tab by default with email and password inputs", () => {
    renderWithRouter();

    expect(screen.getAllByText("auth.signIn").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
    expect(screen.getByText("auth.sendMagicLink")).toBeInTheDocument();
    expect(screen.queryByLabelText("auth.fullName")).not.toBeInTheDocument();
  });

  it("switches to sign-up tab on click", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const signUpTab = screen.getAllByText("auth.signUp")[0];
    await user.click(signUpTab);

    expect(screen.getByLabelText("auth.fullName")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.password")).toBeInTheDocument();
    expect(screen.queryByText("auth.sendMagicLink")).not.toBeInTheDocument();
  });

  it("calls signIn and navigates on sign-in form submission", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByLabelText("auth.email"), "user@test.com");
    await user.type(screen.getByLabelText("auth.password"), "secret123");

    const submitButtons = screen.getAllByRole("button", { name: /auth\.signIn/ });
    await user.click(submitButtons.find((b) => b.getAttribute("type") === "submit")!);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("user@test.com", "secret123");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/account", { replace: true });
  });

  it("navigates to the from path after sign-in", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", { from: { pathname: "/dashboard" } });

    await user.type(screen.getByLabelText("auth.email"), "user@test.com");
    await user.type(screen.getByLabelText("auth.password"), "secret123");

    const submitButtons = screen.getAllByRole("button", { name: /auth\.signIn/ });
    await user.click(submitButtons.find((b) => b.getAttribute("type") === "submit")!);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("calls signUp and shows confirmation message on sign-up form submission", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const signUpTab = screen.getAllByText("auth.signUp")[0];
    await user.click(signUpTab);

    await user.type(screen.getByLabelText("auth.fullName"), "Jane Doe");
    await user.type(screen.getByLabelText("auth.email"), "jane@test.com");
    await user.type(screen.getByLabelText("auth.password"), "secret123");

    const submitButtons = screen.getAllByRole("button", { name: /auth\.signUp/ });
    await user.click(submitButtons.find((b) => b.getAttribute("type") === "submit")!);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "jane@test.com",
        "secret123",
        "Jane Doe",
      );
    });
    expect(
      screen.getByText("Check your email for a confirmation link."),
    ).toBeInTheDocument();
  });

  it("calls signInWithOtp with email for magic link flow", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByLabelText("auth.email"), "magic@test.com");
    await user.click(screen.getByText("auth.sendMagicLink"));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith("magic@test.com");
    });
    expect(
      screen.getByText("Check your email for a sign-in link."),
    ).toBeInTheDocument();
  });

  it("stores the from path when a magic link is requested", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", undefined, "?from=%2Fprepare-painting");

    await user.type(screen.getByLabelText("auth.email"), "magic@test.com");
    await user.click(screen.getByText("auth.sendMagicLink"));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith("magic@test.com");
    });
    expect(sessionStorage.getItem("post-auth-redirect")).toBe(
      "/prepare-painting",
    );
  });

  it("shows error when magic link clicked without email", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByText("auth.sendMagicLink"));

    expect(
      screen.getByText("Enter your email to receive a magic link."),
    ).toBeInTheDocument();
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("displays error from URL params on load", () => {
    render(
      <MemoryRouter initialEntries={["/auth?error=some_error"]}>
        <AuthPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Authentication failed. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows loading state during sign-in submission", async () => {
    let resolveSignIn: () => void = () => {};
    mockSignIn.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      }),
    );

    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByLabelText("auth.email"), "user@test.com");
    await user.type(screen.getByLabelText("auth.password"), "secret123");

    const submitButtons = screen.getAllByRole("button", { name: /auth\.signIn/ });
    const submitBtn = submitButtons.find((b) => b.getAttribute("type") === "submit")!;
    await user.click(submitBtn);

    expect(screen.getByLabelText("auth.email")).toBeDisabled();
    expect(screen.getByLabelText("auth.password")).toBeDisabled();
    expect(submitBtn).toBeDisabled();

    resolveSignIn();

    await waitFor(() => {
      expect(screen.getByLabelText("auth.email")).not.toBeDisabled();
    });
  });

  it("stores the from path in sessionStorage when Google OAuth is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", { from: { pathname: "/checkout" } });

    const googleButton = screen.getByText("Google");
    await user.click(googleButton);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    expect(sessionStorage.getItem("post-auth-redirect")).toBe("/checkout");

    sessionStorage.clear();
  });

  it("stores the prepare-painting path when Facebook OAuth is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", { from: { pathname: "/prepare-painting" } });

    const facebookButton = screen.getByText("Facebook");
    await user.click(facebookButton);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith("facebook");
    expect(sessionStorage.getItem("post-auth-redirect")).toBe(
      "/prepare-painting",
    );

    sessionStorage.clear();
  });

  it("stores the from path for any non-auth page", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", { from: { pathname: "/account" } });

    await user.click(screen.getByText("Google"));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    expect(sessionStorage.getItem("post-auth-redirect")).toBe("/account");
  });

  it("reads the from path from the query parameter when router state is lost", async () => {
    const user = userEvent.setup();
    renderWithRouter("/auth", undefined, "?from=%2Fprepare-painting");

    await user.click(screen.getByText("Google"));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    expect(sessionStorage.getItem("post-auth-redirect")).toBe(
      "/prepare-painting",
    );
  });

  it("does not store a redirect when there is no from path", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByText("Google"));

    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google");
    expect(sessionStorage.getItem("post-auth-redirect")).toBeNull();
  });

  it("clears a stale redirect when there is no from path", async () => {
    sessionStorage.setItem("post-auth-redirect", "/prepare-painting");

    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByText("Google"));

    expect(sessionStorage.getItem("post-auth-redirect")).toBeNull();
  });
});
