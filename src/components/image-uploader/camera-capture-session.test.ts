import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  markCaptureStarted,
  clearCapturePending,
  consumeInterruptedCapture,
  persistSelectionError,
  clearPersistedSelectionError,
  consumePersistedSelectionError,
} from "./camera-capture-session";

describe("camera-capture-session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("interrupted capture marker", () => {
    it("reports the source when a fresh marker was never answered by a file", () => {
      markCaptureStarted("camera");

      expect(consumeInterruptedCapture()).toBe("camera");
    });

    it("consumes the marker so a second read reports nothing", () => {
      markCaptureStarted("gallery");
      consumeInterruptedCapture();

      expect(consumeInterruptedCapture()).toBeNull();
    });

    it("reports nothing when the marker was explicitly cleared", () => {
      markCaptureStarted("camera");
      clearCapturePending();

      expect(consumeInterruptedCapture()).toBeNull();
    });

    it("ignores stale markers older than the max age", () => {
      markCaptureStarted("camera");
      const raw = JSON.parse(
        sessionStorage.getItem("uploader-camera-capture-pending")!,
      ) as { savedAt: number };
      sessionStorage.setItem(
        "uploader-camera-capture-pending",
        JSON.stringify({ ...raw, savedAt: raw.savedAt - 6 * 60 * 1000 }),
      );

      expect(consumeInterruptedCapture()).toBeNull();
    });

    it("ignores invalid marker payloads", () => {
      sessionStorage.setItem("uploader-camera-capture-pending", "not-json{");

      expect(consumeInterruptedCapture()).toBeNull();
    });
  });

  describe("persisted selection error", () => {
    it("round-trips a persisted error message", () => {
      persistSelectionError("too small");

      expect(consumePersistedSelectionError()).toBe("too small");
      expect(consumePersistedSelectionError()).toBeNull();
    });

    it("clears a persisted error", () => {
      persistSelectionError("too small");
      clearPersistedSelectionError();

      expect(consumePersistedSelectionError()).toBeNull();
    });

    it("ignores stale persisted errors", () => {
      persistSelectionError("too small");
      const raw = JSON.parse(
        sessionStorage.getItem("uploader-selection-error")!,
      ) as { savedAt: number };
      sessionStorage.setItem(
        "uploader-selection-error",
        JSON.stringify({ ...raw, savedAt: raw.savedAt - 6 * 60 * 1000 }),
      );

      expect(consumePersistedSelectionError()).toBeNull();
    });
  });

  describe("storage failures", () => {
    it("tolerates a throwing sessionStorage", () => {
      const getItem = vi.fn(() => {
        throw new Error("quota");
      });
      vi.stubGlobal("sessionStorage", {
        getItem,
        setItem: vi.fn(() => {
          throw new Error("quota");
        }),
        removeItem: vi.fn(() => {
          throw new Error("quota");
        }),
      });

      expect(() => markCaptureStarted("camera")).not.toThrow();
      expect(consumeInterruptedCapture()).toBeNull();
      expect(() => persistSelectionError("x")).not.toThrow();
      expect(consumePersistedSelectionError()).toBeNull();

      vi.unstubAllGlobals();
    });
  });
});
