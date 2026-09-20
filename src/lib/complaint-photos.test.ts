import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cloudinary", () => ({
  cloudinaryConfig: { cloudName: "test-cloud", uploadPreset: "test-preset" },
  getCloudinaryUploadConfigError: () => null,
}));

import {
  COMPLAINT_PHOTO_MAX_BYTES,
  COMPLAINT_PHOTO_MAX_COUNT,
  getComplaintPhotoThumbnailUrl,
  uploadComplaintPhoto,
  validateComplaintPhoto,
} from "./complaint-photos";

class MockXMLHttpRequest {
  static _instance: MockXMLHttpRequest | null = null;
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn();
  upload: { onprogress: ((e: unknown) => void) | null } = { onprogress: null };
  onload: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  status = 200;
  response: unknown = {
    public_id: "tuus-imago/complaints/damage",
    secure_url:
      "https://res.cloudinary.com/test-cloud/image/upload/v1/tuus-imago/complaints/damage.jpg",
    width: 800,
    height: 600,
    bytes: 12345,
    format: "jpg",
    url: "https://res.cloudinary.com/test-cloud/image/upload/v1/tuus-imago/complaints/damage.jpg",
  };
  responseType = "";
  addEventListener = vi.fn();
  removeEventListener = vi.fn();

  constructor() {
    MockXMLHttpRequest._instance = this;
  }
}

const originalXMLHttpRequest = globalThis.XMLHttpRequest;

function imageFile(name = "damage.jpg", size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type: "image/jpeg" });
  return file;
}

describe("validateComplaintPhoto", () => {
  it("accepts an image within the size limit", () => {
    expect(validateComplaintPhoto(imageFile(), 0)).toBeNull();
  });

  it("rejects once the maximum photo count is reached", () => {
    expect(validateComplaintPhoto(imageFile(), COMPLAINT_PHOTO_MAX_COUNT)).toBe(
      "tooMany",
    );
  });

  it("rejects a non-image file", () => {
    const file = new File(["data"], "notes.pdf", { type: "application/pdf" });
    expect(validateComplaintPhoto(file, 0)).toBe("invalidType");
  });

  it("rejects a file above the size limit", () => {
    expect(
      validateComplaintPhoto(imageFile("big.jpg", COMPLAINT_PHOTO_MAX_BYTES + 1), 0),
    ).toBe("tooLarge");
  });
});

describe("getComplaintPhotoThumbnailUrl", () => {
  it("inserts a resize transformation for thumbnails", () => {
    const url =
      "https://res.cloudinary.com/test-cloud/image/upload/v1/tuus-imago/complaints/a.jpg";

    expect(getComplaintPhotoThumbnailUrl(url, 256)).toBe(
      "https://res.cloudinary.com/test-cloud/image/upload/w_256,h_256,c_fill,q_auto,f_auto/v1/tuus-imago/complaints/a.jpg",
    );
  });
});

describe("uploadComplaintPhoto", () => {
  beforeEach(() => {
    MockXMLHttpRequest._instance = null;
    globalThis.XMLHttpRequest =
      MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
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
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXMLHttpRequest;
    vi.unstubAllGlobals();
  });

  it("uploads to the complaint folder and returns the asset", async () => {
    const uploadPromise = uploadComplaintPhoto(imageFile());

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest._instance?.send).toHaveBeenCalled();
    });

    MockXMLHttpRequest._instance!.onload!({} as Event);
    const photo = await uploadPromise;

    const signatureBody = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(signatureBody.paramsToSign.folder).toBe("tuus-imago/complaints");
    expect(photo).toEqual({
      url: "https://res.cloudinary.com/test-cloud/image/upload/v1/tuus-imago/complaints/damage.jpg",
      publicId: "tuus-imago/complaints/damage",
    });
  });
});
