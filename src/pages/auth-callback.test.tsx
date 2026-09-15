import { render, screen, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthCallbackPage } from "./auth-callback";
import {
  POST_AUTH_REDIRECT_KEY,
  setPostAuthRedirect,
} from "@/lib/post-auth-redirect";

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

it("leaves the success redirect to AuthProvider and cleans the URL", async () => {
  renderWithRouter();

  await waitFor(() => {
    expect(mockGetSession).toHaveBeenCalled();
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

it("clears the stored path when the callback fails", async () => {
  mockGetSession.mockResolvedValue({ data: { session: null } });
  setPostAuthRedirect("/prepare-painting");

  renderWithRouter();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/auth?error=callback_failed", {
      replace: true,
    });
  });
  expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
});
