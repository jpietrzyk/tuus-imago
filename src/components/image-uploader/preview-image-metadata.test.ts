import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildPreviewImageMetadata } from "./preview-image-metadata";
import * as proportionCalculator from "./image-proportion-calculator";

describe("buildPreviewImageMetadata", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds metadata from source dimensions and formatted ratio", () => {
    vi.spyOn(proportionCalculator, "formatAspectRatio").mockReturnValue("3:2");

    const metadata = buildPreviewImageMetadata({
      sourceWidth: 1200,
      sourceHeight: 800,
    });

    expect(metadata).toEqual({
      width: 1200,
      height: 800,
      aspectRatio: "3:2",
    });
  });

  it("delegates ratio formatting to formatAspectRatio with source dimensions", () => {
    const formatSpy = vi
      .spyOn(proportionCalculator, "formatAspectRatio")
      .mockReturnValue("1:1");

    buildPreviewImageMetadata({
      sourceWidth: 900,
      sourceHeight: 900,
    });

    expect(formatSpy).toHaveBeenCalledWith(900, 900);
  });
});
