import { describe, expect, it } from "vitest";
import {
  getRestingDisplayCropDimensions,
  getRotatedImageMetadata,
  isQuarterTurnRotation,
} from "./rotated-image-properties";

describe("isQuarterTurnRotation", () => {
  it("detects 90 and 270 degrees", () => {
    expect(isQuarterTurnRotation(90)).toBe(true);
    expect(isQuarterTurnRotation(270)).toBe(true);
  });

  it("normalizes rotations outside [0, 360)", () => {
    expect(isQuarterTurnRotation(450)).toBe(true);
    expect(isQuarterTurnRotation(-90)).toBe(true);
    expect(isQuarterTurnRotation(360)).toBe(false);
    expect(isQuarterTurnRotation(180)).toBe(false);
  });

  it("treats missing rotation as no quarter turn", () => {
    expect(isQuarterTurnRotation(undefined)).toBe(false);
    expect(isQuarterTurnRotation(0)).toBe(false);
  });
});

describe("getRotatedImageMetadata", () => {
  const metadata = { width: 3000, height: 2000, aspectRatio: "3:2" };

  it("swaps dimensions and aspect ratio for a 90 degree rotation", () => {
    expect(getRotatedImageMetadata(metadata, 90)).toEqual({
      width: 2000,
      height: 3000,
      aspectRatio: "2:3",
    });
  });

  it("swaps dimensions and aspect ratio for a 270 degree rotation", () => {
    expect(getRotatedImageMetadata(metadata, 270)).toEqual({
      width: 2000,
      height: 3000,
      aspectRatio: "2:3",
    });
  });

  it("returns the input unchanged for non-quarter rotations", () => {
    expect(getRotatedImageMetadata(metadata, 0)).toBe(metadata);
    expect(getRotatedImageMetadata(metadata, 180)).toBe(metadata);
    expect(getRotatedImageMetadata(metadata, undefined)).toBe(metadata);
  });
});

describe("getRestingDisplayCropDimensions", () => {
  it("uses the full source when the frame matches the image shape", () => {
    expect(
      getRestingDisplayCropDimensions({
        sourceWidth: 3000,
        sourceHeight: 2000,
        proportion: "horizontal",
        rotation: 0,
      }),
    ).toEqual({ width: 3000, height: 2000 });
  });

  it("cuts the source to the frame aspect for mismatched shapes", () => {
    expect(
      getRestingDisplayCropDimensions({
        sourceWidth: 3000,
        sourceHeight: 2000,
        proportion: "vertical",
        rotation: 0,
      }),
    ).toEqual({ width: 1333.3333333333333, height: 2000 });
  });

  it("flips the printed crop for a 90 degree rotation of a landscape image in a horizontal frame", () => {
    // After a quarter turn only a portrait band of the source fills the
    // horizontal frame, so the printed pixels are 2000 x 1333.(3) — a
    // landscape image rotated 90° must be treated as portrait.
    expect(
      getRestingDisplayCropDimensions({
        sourceWidth: 3000,
        sourceHeight: 2000,
        proportion: "horizontal",
        rotation: 90,
      }),
    ).toEqual({ width: 2000, height: 1333.3333333333333 });
  });

  it("keeps the full rotated source when the frame matches after rotation", () => {
    expect(
      getRestingDisplayCropDimensions({
        sourceWidth: 3000,
        sourceHeight: 2000,
        proportion: "vertical",
        rotation: 90,
      }),
    ).toEqual({ width: 2000, height: 3000 });
  });

  it("leaves square crops symmetric under rotation", () => {
    expect(
      getRestingDisplayCropDimensions({
        sourceWidth: 3000,
        sourceHeight: 2000,
        proportion: "square",
        rotation: 90,
      }),
    ).toEqual({ width: 2000, height: 2000 });
  });
});
