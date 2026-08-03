import { afterEach, describe, expect, it } from "vitest";
import {
  IMAGE_DPI_RULES,
  applyDpiRulesOverride,
  resetDpiRules,
} from "./image-dpi-rules";

describe("image-dpi-rules runtime override", () => {
  afterEach(() => {
    resetDpiRules();
  });

  it("exposes the default min DPI of 72", () => {
    expect(IMAGE_DPI_RULES.minDpi).toBe(72);
  });

  it("mutates minDpi in place so existing importers observe the new value", () => {
    applyDpiRulesOverride({ minDpi: 150 });
    expect(IMAGE_DPI_RULES.minDpi).toBe(150);
  });

  it("supports disabling enforcement via a zero floor", () => {
    applyDpiRulesOverride({ minDpi: 0 });
    expect(IMAGE_DPI_RULES.minDpi).toBe(0);
  });

  it("restores the default floor after reset", () => {
    applyDpiRulesOverride({ minDpi: 0 });
    resetDpiRules();
    expect(IMAGE_DPI_RULES.minDpi).toBe(72);
  });

  it("leaves the quality thresholds untouched by overrides", () => {
    applyDpiRulesOverride({ minDpi: 200 });
    expect(IMAGE_DPI_RULES.qualityThresholds).toEqual({
      excellent: 300,
      good: 150,
      acceptable: 72,
    });
  });
});
