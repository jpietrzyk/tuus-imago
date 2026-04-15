import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/cloudinary", () => ({
  cloudinaryConfig: { cloudName: "test-cloud", uploadPreset: "test-preset" },
  getCloudinaryUploadConfigError: () => null,
}));

vi.mock("@/lib/image-transformations", () => ({
  getTransformedPreviewUrl: (url: string) => `${url}?transformed=1`,
}));

import { uploadImageToCloudinary } from "./cloudinary-upload";

class MockXMLHttpRequest {
  static _instance: MockXMLHttpRequest | null = null;
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn();
  upload: { onprogress: ((e: unknown) => void) | null } = {
    onprogress: null,
  };
  onload: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  status = 200;
  response: unknown = {
    public_id: "test-photo",
    secure_url:
      "https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg",
    width: 800,
    height: 600,
    bytes: 12345,
    format: "jpg",
    url: "https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg",
  };
  responseType = "";
  addEventListener = vi.fn();
  removeEventListener = vi.fn();

  constructor() {
    MockXMLHttpRequest._instance = this;
  }
}

const originalXMLHttpRequest = globalThis.XMLHttpRequest;

function mockSignatureSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          signature: "sig-123",
          timestamp: 1700000000,
          apiKey: "api-key-123",
        }),
    }),
  );
}

describe("cloudinary-upload", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MockXMLHttpRequest._instance = null;
    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    mockSignatureSuccess();
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXMLHttpRequest;
    vi.unstubAllGlobals();
  });

  const defaultTransformations = {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    brightness: 0,
    contrast: 0,
    grayscale: 0,
    blur: 0,
  };

  it("requests upload signature and uploads via XHR", async () => {
    const uploadPromise = uploadImageToCloudinary({
      file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
      transformations: defaultTransformations,
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance?.send).toHaveBeenCalled();
    });

    MockXMLHttpRequest._instance!.onload!({} as Event);

    const result = await uploadPromise;

    expect(fetch).toHaveBeenCalledWith(
      "/.netlify/functions/cloudinary-signature",
      expect.objectContaining({ method: "POST" }),
    );
    expect(MockXMLHttpRequest._instance!.open).toHaveBeenCalledWith(
      "POST",
      "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
    );
    expect(result.asset.public_id).toBe("test-photo");
    expect(result.transformedUrl).toContain("transformed=1");
  });

  it("calls onUploadProgress callback", async () => {
    const onProgress = vi.fn();

    const uploadPromise = uploadImageToCloudinary({
      file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
      transformations: defaultTransformations,
      onUploadProgress: onProgress,
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance).toBeTruthy();
    });

    MockXMLHttpRequest._instance!.upload.onprogress!({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as unknown as ProgressEvent);

    MockXMLHttpRequest._instance!.onload!({} as Event);

    await uploadPromise;

    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it("rejects on XHR network error", async () => {
    const uploadPromise = uploadImageToCloudinary({
      file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
      transformations: defaultTransformations,
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance?.send).toHaveBeenCalled();
    });

    MockXMLHttpRequest._instance!.onerror!({} as Event);

    await expect(uploadPromise).rejects.toThrow("Cloudinary upload failed.");
  });

  it("rejects on non-2xx XHR status", async () => {
    const instance = MockXMLHttpRequest._instance!;

    const uploadPromise = uploadImageToCloudinary({
      file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
      transformations: defaultTransformations,
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance?.send).toHaveBeenCalled();
    });

    MockXMLHttpRequest._instance!.status = 400;
    MockXMLHttpRequest._instance!.response = {
      error: { message: "Invalid API key" },
    };

    MockXMLHttpRequest._instance!.onload!({} as Event);

    await expect(uploadPromise).rejects.toThrow("Invalid API key");

    void instance;
  });

  it("rejects immediately when AbortSignal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadImageToCloudinary({
        file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
        transformations: defaultTransformations,
        signal: controller.signal,
      }),
    ).rejects.toThrow("Upload aborted.");
  });

  it("aborts XHR when AbortSignal fires mid-upload", async () => {
    const controller = new AbortController();

    const uploadPromise = uploadImageToCloudinary({
      file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
      transformations: defaultTransformations,
      signal: controller.signal,
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance?.send).toHaveBeenCalled();
    });

    controller.abort();

    await expect(uploadPromise).rejects.toThrow("Upload aborted.");
    expect(MockXMLHttpRequest._instance!.abort).toHaveBeenCalled();
  });

  it("rejects when signature request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Signature failed" }),
    });

    await expect(
      uploadImageToCloudinary({
        file: new File(["data"], "photo.jpg", { type: "image/jpeg" }),
        transformations: defaultTransformations,
      }),
    ).rejects.toThrow("Signature failed");
  });
});
