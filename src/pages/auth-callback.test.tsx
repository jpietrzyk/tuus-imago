import { render, screen, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthCallbackPage } from "./auth-callback";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockExchangeCodeForSession = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
      getSession: () => mockGetSession(),
    },
  },
}));

vi.mock("@/lib/auth-context", () => ({
  POST_AUTH_REDIRECT_KEY: "post_auth_redirect",
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <AuthCallbackPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockExchangeCodeForSession.mockResolvedValue({ error: null });
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: "token" } },
  });
});

it("shows loading spinner on mount", () => {
  renderWithRouter();
  expect(screen.getByText("Signing you in...")).toBeInTheDocument();
});

it("calls exchangeCodeForSession when URL has code param", async () => {
  const originalLocation = window.location;
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...originalLocation,
      search: "?code=abc123",
      href: "http://localhost:3000/auth/callback?code=abc123",
    },
  });

  renderWithRouter();

  await waitFor(() => {
    expect(mockExchangeCodeForSession).toHaveBeenCalledOnce();
  });
  expect(mockExchangeCodeForSession).toHaveBeenCalledWith(
    "http://localhost:3000/auth/callback?code=abc123",
  );

  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...originalLocation,
      search: "",
      href: "http://localhost:3000/auth/callback",
    },
  });
});

it("redirects to /auth?error=callback_failed when session is null", async () => {
  mockGetSession.mockResolvedValue({ data: { session: null } });

  renderWithRouter();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/auth?error=callback_failed", {
      replace: true,
    });
  });
});

it("redirects to / when session exists and no checkout redirect key", async () => {
  renderWithRouter();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});

it("redirects to /checkout when POST_AUTH_REDIRECT_KEY is in sessionStorage and clears it", async () => {
  sessionStorage.setItem("post_auth_redirect", "/checkout");

  renderWithRouter();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/checkout", { replace: true });
  });
  expect(sessionStorage.getItem("post_auth_redirect")).toBeNull();
});

it("cleans up POST_AUTH_REDIRECT_KEY from sessionStorage", async () => {
  sessionStorage.setItem("post_auth_redirect", "/checkout");

  renderWithRouter();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalled();
  });
  expect(sessionStorage.getItem("post_auth_redirect")).toBeNull();
});
