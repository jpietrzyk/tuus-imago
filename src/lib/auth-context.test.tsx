import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";
import {
  POST_AUTH_REDIRECT_KEY,
  setPostAuthRedirect,
} from "./post-auth-redirect";
import type { Session, Subscription, User } from "@supabase/supabase-js";

const mockUser = { id: "user-1", email: "test@example.com" } as User;
const mockSession = {
  access_token: "token-123",
  user: mockUser,
} as Session;

let onAuthStateChangeCb: (event: string, session: Session | null) => void =
  () => {};
const mockSubscriptionUnsubscribe = vi.fn();

const mockGetSession = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOutFn = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn(
        (cb: (event: string, session: Session | null) => void) => {
          onAuthStateChangeCb = cb;
          return {
            data: {
              subscription: {
                unsubscribe: mockSubscriptionUnsubscribe,
              } as unknown as Subscription,
            },
          };
        },
      ),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOutFn(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

function ShowAuth() {
  const { loading, user, session } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user-email">{user?.email ?? "none"}</span>
      <span data-testid="token">{session?.access_token ?? "none"}</span>
    </div>
  );
}

function AuthActions({
  action,
}: {
  action: (auth: ReturnType<typeof useAuth>) => Promise<void>;
}) {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <button
        data-testid="trigger"
        onClick={async () => {
          try {
            await action(auth);
          } catch {
            // errors are asserted via expects inside the action
          }
        }}
      />
    </div>
  );
}

async function renderWithAction(
  action: (auth: ReturnType<typeof useAuth>) => Promise<void>,
) {
  render(
    <AuthProvider>
      <AuthActions action={action} />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("loading")).toHaveTextContent("false"),
  );
  await fireEvent.click(screen.getByTestId("trigger"));
}

describe("auth-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders children inside AuthProvider", () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("starts loading=true, then false after getSession resolves", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
  });

  it("populates user and session from getSession", async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      ),
    );
    expect(screen.getByTestId("token")).toHaveTextContent("token-123");
  });

  it("sets user/session to null when getSession returns no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  it("responds to auth state changes", async () => {
    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    await act(async () => {
      onAuthStateChangeCb("SIGNED_IN", mockSession);
    });

    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "test@example.com",
    );
  });

  it("does not consume or redirect on SIGNED_IN when a redirect key is present", async () => {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, "/prepare-painting");
    const originalHref = window.location.href;

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    await act(async () => {
      onAuthStateChangeCb("SIGNED_IN", mockSession);
    });

    expect(window.location.href).toBe(originalHref);
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe(
      "/prepare-painting",
    );
  });

  it("does not redirect on SIGNED_IN when no redirect key", async () => {
    const originalHref = window.location.href;

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    await act(async () => {
      onAuthStateChangeCb("SIGNED_IN", mockSession);
    });

    expect(window.location.href).toBe(originalHref);
  });

  it("unsubscribes from auth listener on unmount", async () => {
    const { unmount } = render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    unmount();
    expect(mockSubscriptionUnsubscribe).toHaveBeenCalled();
  });

  it("useAuth throws when used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ShowAuth />)).toThrow(
      "useAuth must be used within an AuthProvider.",
    );
    spy.mockRestore();
  });

  describe("auth methods", () => {
    it("signUp calls supabase.auth.signUp with correct params", async () => {
      mockSignUp.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.signUp("a@b.com", "pass", "John");
      });
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "pass",
        options: { data: { full_name: "John" } },
      });
    });

    it("signUp propagates error", async () => {
      mockSignUp.mockResolvedValue({
        error: new Error("Signup failed"),
      });
      await renderWithAction(async (auth) => {
        await expect(auth.signUp("a@b.com", "pass", "John")).rejects.toThrow(
          "Signup failed",
        );
      });
    });

    it("signIn calls supabase.auth.signInWithPassword", async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.signIn("a@b.com", "pass");
      });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "pass",
      });
    });

    it("signIn propagates error", async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: new Error("Invalid credentials"),
      });
      await renderWithAction(async (auth) => {
        await expect(auth.signIn("a@b.com", "wrong")).rejects.toThrow(
          "Invalid credentials",
        );
      });
    });

    it("signOut calls supabase.auth.signOut", async () => {
      mockSignOutFn.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.signOut();
      });
      expect(mockSignOutFn).toHaveBeenCalled();
    });

    it("signOut propagates error", async () => {
      mockSignOutFn.mockResolvedValue({ error: new Error("Signout failed") });
      await renderWithAction(async (auth) => {
        await expect(auth.signOut()).rejects.toThrow("Signout failed");
      });
    });

    it("signInWithOAuth calls supabase with provider and redirect", async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.signInWithOAuth("google");
      });
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    });

    it("signInWithOtp calls supabase with email and redirect", async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.signInWithOtp("magic@test.com");
      });
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "magic@test.com",
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
    });

    it("resetPassword calls supabase.resetPasswordForEmail", async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.resetPassword("user@test.com");
      });
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@test.com", {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
    });

    it("updatePassword calls supabase.auth.updateUser", async () => {
      mockUpdateUser.mockResolvedValue({ error: null });
      await renderWithAction(async (auth) => {
        await auth.updatePassword("newPass123");
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newPass123" });
    });
  });
});

describe("auth-context OAuth return redirect", () => {
  const originalLocation = window.location;

  function useLocation(overrides: {
    href: string;
    pathname: string;
  }): ReturnType<typeof vi.fn> {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        href: overrides.href,
        pathname: overrides.pathname,
        search: "",
        origin: "https://tuusimago.com",
        assign,
      },
    });
    return assign;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("redirects to the stored path when the app lands on a non-callback route", async () => {
    setPostAuthRedirect("/prepare-painting");
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const assign = useLocation({
      href: "https://tuusimago.com/#access_token=abc&token_type=bearer",
      pathname: "/",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("/prepare-painting"),
    );
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("does not redirect on a normal page load without an OAuth response", async () => {
    setPostAuthRedirect("/checkout");
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const assign = useLocation({
      href: "https://tuusimago.com/prepare-painting",
      pathname: "/prepare-painting",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
    expect(assign).not.toHaveBeenCalled();
    // The stored path is untouched because this was not an OAuth return.
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe("/checkout");
  });

  it("redirects on the callback route too (single owner)", async () => {
    setPostAuthRedirect("/prepare-painting");
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const assign = useLocation({
      href: "https://tuusimago.com/auth/callback#access_token=abc",
      pathname: "/auth/callback",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith("/prepare-painting"),
    );
  });

  it("falls back to the site root when no path is stored", async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const assign = useLocation({
      href: "https://tuusimago.com/auth/callback#access_token=abc",
      pathname: "/auth/callback",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
  });

  it("does not redirect a later sign-in after an OAuth error return", async () => {
    setPostAuthRedirect("/prepare-painting");
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const assign = useLocation({
      href: "https://tuusimago.com/#error_description=Something+failed",
      pathname: "/",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );

    // The user retries with email/password in the same page load.
    act(() => {
      onAuthStateChangeCb("SIGNED_IN", mockSession);
    });

    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe(
      "/prepare-painting",
    );
  });

  it("does not redirect a password-recovery return", async () => {
    setPostAuthRedirect("/prepare-painting");
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    const assign = useLocation({
      href: "https://tuusimago.com/auth/update-password#access_token=abc&type=recovery",
      pathname: "/auth/update-password",
    });

    render(
      <AuthProvider>
        <ShowAuth />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false"),
    );
    expect(assign).not.toHaveBeenCalled();
    // Left for a genuine OAuth return to consume.
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe(
      "/prepare-painting",
    );
  });
});
