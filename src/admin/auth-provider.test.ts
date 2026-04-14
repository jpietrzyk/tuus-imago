import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { adminAuthProvider } from "./auth-provider";
import { supabase } from "@/lib/supabase-client";

const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
const mockSignOut = vi.mocked(supabase.auth.signOut);
const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockRefreshSession = vi.mocked(supabase.auth.refreshSession);
const mockExchangeCode = vi.mocked(supabase.auth.exchangeCodeForSession);
const mockFrom = vi.mocked(supabase.from);

function mockProfileQuery(data: Record<string, unknown>) {
  const single = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select } as never);
}

describe("adminAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("succeeds for valid admin credentials", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: { user: { id: "u1" }, session: { access_token: "tok" } },
        error: null,
      } as never);
      mockProfileQuery({ is_admin: true });
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: "tok" } },
      } as never);

      const result = await adminAuthProvider.login({
        email: "admin@test.com",
        password: "pass",
      });

      expect(result).toEqual({ success: true, redirectTo: "/admin" });
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "pass",
      });
    });

    it("rejects non-admin user", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: { user: { id: "u1" } },
        error: null,
      } as never);
      mockProfileQuery({ is_admin: false });
      mockSignOut.mockResolvedValueOnce({ error: null } as never);

      const result = await adminAuthProvider.login({
        email: "user@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.name).toBe("ForbiddenError");
        expect(result.error?.message).toBe("Not an admin user.");
      }
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("returns error on signIn failure", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: {},
        error: { message: "Invalid credentials" },
      } as never);

      const result = await adminAuthProvider.login({
        email: "admin@test.com",
        password: "wrong",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.name).toBe("LoginError");
        expect(result.error?.message).toBe("Invalid credentials");
      }
    });

    it("returns error when email or password missing", async () => {
      const result = await adminAuthProvider.login({ email: "", password: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.message).toBe("Missing email or password.");
      }
    });
  });

  describe("logout", () => {
    it("signs out and redirects to login", async () => {
      mockSignOut.mockResolvedValueOnce({ error: null } as never);

      const result = await adminAuthProvider.logout();

      expect(result).toEqual({ success: true, redirectTo: "/admin/login" });
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe("check", () => {
    it("returns authenticated for admin with existing session", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: "u1" } } },
      } as never);
      mockProfileQuery({ is_admin: true });

      const result = await adminAuthProvider.check();

      expect(result).toEqual({ authenticated: true });
    });

    it("exchanges OAuth code and authenticates", async () => {
      mockGetSession
        .mockResolvedValueOnce({ data: { session: null } } as never)
        .mockResolvedValueOnce({
          data: { session: { user: { id: "u1" } } },
        } as never);
      mockExchangeCode.mockResolvedValueOnce({ error: null } as never);
      mockProfileQuery({ is_admin: true });

      const replaceStateSpy = vi
        .spyOn(window.history, "replaceState")
        .mockImplementation(() => {});

      const originalSearch = window.location.search;
      const originalHash = window.location.hash;
      try {
        Object.defineProperty(window, "location", {
          writable: true,
          value: {
            ...window.location,
            search: "?code=oauth-code-123",
            hash: "",
            href: "http://localhost/admin?code=oauth-code-123",
          },
        });

        const result = await adminAuthProvider.check();

        expect(result).toEqual({ authenticated: true });
        expect(mockExchangeCode).toHaveBeenCalled();
        expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/admin");
      } finally {
        Object.defineProperty(window, "location", {
          writable: true,
          value: {
            ...window.location,
            search: originalSearch,
            hash: originalHash,
          },
        });
        replaceStateSpy.mockRestore();
      }
    });

    it("returns unauthenticated when no session and no code", async () => {
      mockGetSession
        .mockResolvedValueOnce({ data: { session: null } } as never)
        .mockResolvedValueOnce({ data: { session: null } } as never);

      const result = await adminAuthProvider.check();

      expect(result).toEqual({
        authenticated: false,
        redirectTo: "/admin/login",
      });
    });
  });

  describe("onError", () => {
    it("recovers session on 401", async () => {
      mockRefreshSession.mockResolvedValueOnce({
        data: { session: { access_token: "new-tok" } },
      } as never);

      const error = { statusCode: 401 };
      const result = await adminAuthProvider.onError(error);

      expect(result).toEqual({ error });
      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it("forces logout on 401 when refresh fails", async () => {
      mockRefreshSession.mockResolvedValueOnce({
        data: { session: null },
      } as never);

      const error = { statusCode: 401 };
      const result = await adminAuthProvider.onError(error);

      expect(result).toEqual({
        logout: true,
        error,
        redirectTo: "/admin/login",
      });
    });

    it("forces logout on 403 without refresh attempt", async () => {
      const error = { statusCode: 403 };
      const result = await adminAuthProvider.onError(error);

      expect(result).toEqual({
        logout: true,
        error,
        redirectTo: "/admin/login",
      });
      expect(mockRefreshSession).not.toHaveBeenCalled();
    });

    it("returns error only for other status codes", async () => {
      const error = { statusCode: 500 };
      const result = await adminAuthProvider.onError(error);

      expect(result).toEqual({ error });
    });
  });

  describe("getIdentity", () => {
    it("returns merged user and profile data", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: { user: { id: "u1", email: "admin@test.com" } },
        },
      } as never);

      const single = vi.fn().mockResolvedValue({
        data: { full_name: "Admin User", is_admin: true },
        error: null,
      });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select } as never);

      const result = await adminAuthProvider.getIdentity();

      expect(result).toEqual({
        id: "u1",
        email: "admin@test.com",
        name: "Admin User",
        isAdmin: true,
      });
    });

    it("returns null when no session", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      } as never);

      const result = await adminAuthProvider.getIdentity();

      expect(result).toBeNull();
    });

    it("falls back to email for name when profile is null", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: { user: { id: "u1", email: "admin@test.com" } },
        },
      } as never);

      const single = vi.fn().mockResolvedValue({ data: null, error: null });
      const eq = vi.fn().mockReturnValue({ single });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select } as never);

      const result = await adminAuthProvider.getIdentity();

      expect(result).toEqual({
        id: "u1",
        email: "admin@test.com",
        name: "admin@test.com",
        isAdmin: false,
      });
    });
  });
});
