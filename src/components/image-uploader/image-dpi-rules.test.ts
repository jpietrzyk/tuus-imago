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

  it("has the guard enabled by default", () => {
    expect(IMAGE_DPI_RULES.guardEnabled).toBe(true);
  });

  it("can disable the guard via override", () => {
    applyDpiRulesOverride({ guardEnabled: false });
    expect(IMAGE_DPI_RULES.guardEnabled).toBe(false);
  });

  it("restores the guard after reset", () => {
    applyDpiRulesOverride({ guardEnabled: false });
    resetDpiRules();
    expect(IMAGE_DPI_RULES.guardEnabled).toBe(true);
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

  it("overrides the quality thresholds in place", () => {
    applyDpiRulesOverride({
      qualityThresholds: { excellent: 400, good: 200, acceptable: 100 },
    });
    expect(IMAGE_DPI_RULES.qualityThresholds).toEqual({
      excellent: 400,
      good: 200,
      acceptable: 100,
    });
  });

  it("can override min DPI and quality thresholds together", () => {
    applyDpiRulesOverride({
      minDpi: 50,
      qualityThresholds: { excellent: 250, good: 120, acceptable: 50 },
    });
    expect(IMAGE_DPI_RULES.minDpi).toBe(50);
    expect(IMAGE_DPI_RULES.qualityThresholds).toEqual({
      excellent: 250,
      good: 120,
      acceptable: 50,
    });
  });

  it("restores the quality thresholds after reset", () => {
    applyDpiRulesOverride({
      qualityThresholds: { excellent: 400, good: 200, acceptable: 100 },
    });
    resetDpiRules();
    expect(IMAGE_DPI_RULES.qualityThresholds).toEqual({
      excellent: 300,
      good: 150,
      acceptable: 72,
    });
  });
});
