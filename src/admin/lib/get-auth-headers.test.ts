import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}));

import { getAuthHeaders } from "./get-auth-headers";
import { supabase } from "@/lib/supabase-client";

const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockRefreshSession = vi.mocked(supabase.auth.refreshSession);

describe("getAuthHeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns headers with Bearer token when session exists", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "test-token-123",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    } as never);

    const headers = await getAuthHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer test-token-123",
    });
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it("refreshes session when token is expiring within 60s", async () => {
    const expiringAt = Math.floor(Date.now() / 1000) + 30;

    mockGetSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "expiring-token",
          expires_at: expiringAt,
        },
      },
    } as never);

    mockRefreshSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "refreshed-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    } as never);

    const headers = await getAuthHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer refreshed-token",
    });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
  });

  it("tries refresh when no session exists", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    } as never);

    mockRefreshSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "recovered-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    } as never);

    const headers = await getAuthHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer recovered-token",
    });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
  });

  it("returns headers without Authorization when no token available", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    } as never);

    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
    } as never);

    const headers = await getAuthHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
    });
  });
});
