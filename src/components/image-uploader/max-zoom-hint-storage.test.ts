import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasShownMaxZoomHint,
  markMaxZoomHintShown,
  MAX_ZOOM_HINT_STORAGE_KEY,
} from "./max-zoom-hint-storage";

describe("max-zoom-hint storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the hint as not shown by default", () => {
    expect(hasShownMaxZoomHint()).toBe(false);
  });

  it("reports the hint as shown after it is marked", () => {
    markMaxZoomHintShown();

    expect(window.localStorage.getItem(MAX_ZOOM_HINT_STORAGE_KEY)).toBe("true");
    expect(hasShownMaxZoomHint()).toBe(true);
  });

  it("treats a read failure as not shown", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(hasShownMaxZoomHint()).toBe(false);
  });

  it("does not throw when writing fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => markMaxZoomHintShown()).not.toThrow();
  });
});
