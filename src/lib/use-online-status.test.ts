import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOnlineStatus } from "@/lib/use-online-status";

describe("useOnlineStatus", () => {
  it("returns true when navigator is online", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("reacts to offline and online events", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    fireEvent(window, new Event("offline"));
    expect(result.current).toBe(false);

    fireEvent(window, new Event("online"));
    expect(result.current).toBe(true);
  });
});
