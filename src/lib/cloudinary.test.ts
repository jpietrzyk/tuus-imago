import { describe, expect, it, afterEach } from "vitest";
import {
  cloudinaryConfig,
  getCloudinaryUploadConfigError,
  getCloudinaryUrl,
} from "./cloudinary";

describe("cloudinary", () => {
  describe("cloudinaryConfig", () => {
    it("has cloudName and uploadPreset properties", () => {
      expect(cloudinaryConfig).toHaveProperty("cloudName");
      expect(cloudinaryConfig).toHaveProperty("uploadPreset");
    });
  });

  describe("getCloudinaryUploadConfigError", () => {
    const originalCloudName = cloudinaryConfig.cloudName;
    const originalUploadPreset = cloudinaryConfig.uploadPreset;

    afterEach(() => {
      Object.defineProperty(cloudinaryConfig, "cloudName", { value: originalCloudName, writable: true, configurable: true });
      Object.defineProperty(cloudinaryConfig, "uploadPreset", { value: originalUploadPreset, writable: true, configurable: true });
    });

    it("returns null when both config values are present", () => {
      Object.defineProperty(cloudinaryConfig, "cloudName", { value: "test-cloud", writable: true, configurable: true });
      Object.defineProperty(cloudinaryConfig, "uploadPreset", { value: "test-preset", writable: true, configurable: true });

      expect(getCloudinaryUploadConfigError()).toBeNull();
    });

    it("returns error when cloudName is missing", () => {
      Object.defineProperty(cloudinaryConfig, "cloudName", { value: "", writable: true, configurable: true });
      Object.defineProperty(cloudinaryConfig, "uploadPreset", { value: "test-preset", writable: true, configurable: true });

      expect(getCloudinaryUploadConfigError()).toBe("Missing VITE_CLOUDINARY_CLOUD_NAME");
    });

    it("returns error when uploadPreset is missing", () => {
      Object.defineProperty(cloudinaryConfig, "cloudName", { value: "test-cloud", writable: true, configurable: true });
      Object.defineProperty(cloudinaryConfig, "uploadPreset", { value: "", writable: true, configurable: true });

      expect(getCloudinaryUploadConfigError()).toBe("Missing VITE_CLOUDINARY_UPLOAD_PRESET");
    });
  });

  describe("getCloudinaryUrl", () => {
    it("builds URL with publicId only", () => {
      const result = getCloudinaryUrl("my-photo");
      expect(result).toBe(
        `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/my-photo`,
      );
    });

    it("builds URL with options as query string", () => {
      const result = getCloudinaryUrl("my-photo", { width: 200, height: 150 });
      expect(result).toContain("width=200");
      expect(result).toContain("height=150");
      expect(result).toContain("my-photo?");
    });

    it("encodes option values", () => {
      const result = getCloudinaryUrl("my-photo", {
        transformation: "c_fill,w_200",
      });
      expect(result).toContain("transformation=c_fill%2Cw_200");
    });
  });
});
