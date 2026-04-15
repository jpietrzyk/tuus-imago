import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useReferralTracking } from "./use-referral-tracking";
import { MemoryRouter } from "react-router-dom";

vi.mock("./referral-cookie", () => ({
  getReferralCookie: vi.fn(),
}));

import { getReferralCookie } from "./referral-cookie";

const mockGetReferralCookie = vi.mocked(getReferralCookie);

function renderWithRouter(path: string) {
  return renderHook(() => useReferralTracking(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    ),
  });
}

describe("use-referral-tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch when no referral cookie exists", () => {
    mockGetReferralCookie.mockReturnValue(null);

    renderWithRouter("/upload");

    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches with correct payload when cookie exists", async () => {
    mockGetReferralCookie.mockReturnValue("ABC123");

    renderWithRouter("/upload");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/.netlify/functions/track-referral",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ ref_code: "ABC123", path: "/upload" }),
        }),
      );
    });
  });

  it("does not duplicate fetch for same path", async () => {
    mockGetReferralCookie.mockReturnValue("ABC123");

    const { rerender } = renderWithRouter("/upload");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("handles fetch errors silently", async () => {
    mockGetReferralCookie.mockReturnValue("ABC123");
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    renderWithRouter("/upload");

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
