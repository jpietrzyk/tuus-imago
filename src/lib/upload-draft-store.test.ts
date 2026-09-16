import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveUploadDraft,
  loadUploadDraft,
  clearUploadDraft,
  purgeExpiredUploadDraft,
  getUploadDraftMaxAgeMs,
  type UploadDraft,
} from "./upload-draft-store";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeDraft(overrides: Partial<UploadDraft> = {}): UploadDraft {
  return {
    updatedAt: Date.now(),
    activeImageIndex: 1,
    isTriptychSplit: true,
    isTriptychLinked: false,
    selectedPaintingSizeIndex: 3,
    images: [
      {
        slotIndex: 1,
        bytes: new TextEncoder().encode("photo-bytes").buffer,
        fileName: "photo.jpg",
        fileType: "image/jpeg",
        metadata: { width: 4000, height: 3000, aspectRatio: "4:3" },
        displayImageProportion: "horizontal",
        previewEffects: { brightness: 5, contrast: -10, grayscale: 20 },
        previewTransform: {
          rotation: 90,
          flipHorizontal: true,
          flipVertical: false,
        },
        previewCropAdjust: { zoom: 1.4, panX: 0.2, panY: -0.1 },
        triptychWindowIndex: 0,
      },
    ],
    ...overrides,
  };
}

describe("upload draft store", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearUploadDraft();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no draft is stored", async () => {
    expect(await loadUploadDraft()).toBeNull();
  });

  it("round-trips the full draft including the image blob", async () => {
    const draft = makeDraft();
    await saveUploadDraft(draft);

    const loaded = await loadUploadDraft();

    expect(loaded).not.toBeNull();
    expect(loaded?.activeImageIndex).toBe(1);
    expect(loaded?.isTriptychSplit).toBe(true);
    expect(loaded?.isTriptychLinked).toBe(false);
    expect(loaded?.selectedPaintingSizeIndex).toBe(3);

    const image = loaded?.images[0];
    expect(image?.slotIndex).toBe(1);
    expect(image?.fileName).toBe("photo.jpg");
    expect(image?.metadata).toEqual({
      width: 4000,
      height: 3000,
      aspectRatio: "4:3",
    });
    expect(image?.previewEffects).toEqual({
      brightness: 5,
      contrast: -10,
      grayscale: 20,
    });
    expect(image?.previewTransform).toEqual({
      rotation: 90,
      flipHorizontal: true,
      flipVertical: false,
    });
    expect(image?.previewCropAdjust).toEqual({
      zoom: 1.4,
      panX: 0.2,
      panY: -0.1,
    });
    expect(image?.triptychWindowIndex).toBe(0);

    // fake-indexeddb returns a cross-realm ArrayBuffer, so assert on contents
    // rather than instanceof (which would compare across realms).
    expect(image?.bytes?.byteLength).toBe("photo-bytes".length);
    expect(new TextDecoder().decode(image?.bytes as ArrayBuffer)).toBe(
      "photo-bytes",
    );
  });

  it("overwrites the previous draft", async () => {
    await saveUploadDraft(makeDraft({ activeImageIndex: 0 }));
    await saveUploadDraft(makeDraft({ activeImageIndex: 2 }));

    const loaded = await loadUploadDraft();
    expect(loaded?.activeImageIndex).toBe(2);
  });

  it("clears the draft", async () => {
    await saveUploadDraft(makeDraft());
    await clearUploadDraft();

    expect(await loadUploadDraft()).toBeNull();
  });

  it("ignores a malformed stored record", async () => {
    // Simulate a bad record written by an older/corrupt version.
    const request = indexedDB.open("tuus-imago", 1);
    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("upload-draft", "readwrite");
        tx.objectStore("upload-draft").put({ nonsense: true }, "current");
        tx.oncomplete = () => resolve();
      };
    });

    expect(await loadUploadDraft()).toBeNull();
  });

  it("defaults to a 7 day retention window", () => {
    expect(getUploadDraftMaxAgeMs()).toBe(7 * DAY_MS);
  });

  it("keeps a draft inside the retention window", async () => {
    await saveUploadDraft(makeDraft({ updatedAt: Date.now() - 60 * 1000 }));

    expect(await loadUploadDraft()).not.toBeNull();
  });

  it("discards and deletes a draft past the retention window", async () => {
    await saveUploadDraft(makeDraft({ updatedAt: Date.now() - 8 * DAY_MS }));

    expect(await loadUploadDraft()).toBeNull();
    // A second read confirms the record was actually removed, not just hidden.
    expect(await loadUploadDraft()).toBeNull();
  });

  it("honours VITE_UPLOAD_DRAFT_MAX_AGE_HOURS", async () => {
    vi.stubEnv("VITE_UPLOAD_DRAFT_MAX_AGE_HOURS", "1");
    await saveUploadDraft(
      makeDraft({ updatedAt: Date.now() - 2 * 60 * 60 * 1000 }),
    );

    expect(getUploadDraftMaxAgeMs()).toBe(60 * 60 * 1000);
    expect(await loadUploadDraft()).toBeNull();
  });

  it("purges only expired drafts", async () => {
    await saveUploadDraft(makeDraft({ updatedAt: Date.now() - 8 * DAY_MS }));
    expect(await purgeExpiredUploadDraft()).toBe(true);
    expect(await loadUploadDraft()).toBeNull();

    await saveUploadDraft(makeDraft({ updatedAt: Date.now() - 60 * 1000 }));
    expect(await purgeExpiredUploadDraft()).toBe(false);
    expect(await loadUploadDraft()).not.toBeNull();
  });

  it("does not purge when there is no draft", async () => {
    expect(await purgeExpiredUploadDraft()).toBe(false);
  });
});
