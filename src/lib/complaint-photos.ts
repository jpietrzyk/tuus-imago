import {
  uploadFileToCloudinary,
  type CloudinaryUploadedAsset,
} from "@/lib/cloudinary-upload";
import {
  COMPLAINT_PHOTO_FOLDER,
  COMPLAINT_PHOTO_MAX_BYTES,
  COMPLAINT_PHOTO_MAX_COUNT,
} from "@/lib/complaint-limits";

export { COMPLAINT_PHOTO_MAX_BYTES, COMPLAINT_PHOTO_MAX_COUNT };

export interface ComplaintPhoto {
  url: string;
  publicId: string;
}

export type ComplaintPhotoError = "tooMany" | "tooLarge" | "invalidType";

export interface ComplaintPhotoUploadOptions {
  signal?: AbortSignal;
  onUploadProgress?: (fraction: number) => void;
}

/**
 * Client-side guard mirroring the server rule. Returns an error code (mapped to
 * a localized message by the form) or null when the file can be uploaded.
 */
export function validateComplaintPhoto(
  file: File,
  currentCount: number,
): ComplaintPhotoError | null {
  if (currentCount >= COMPLAINT_PHOTO_MAX_COUNT) {
    return "tooMany";
  }

  if (!file.type.startsWith("image/")) {
    return "invalidType";
  }

  if (file.size > COMPLAINT_PHOTO_MAX_BYTES) {
    return "tooLarge";
  }

  return null;
}

/**
 * Small Cloudinary delivery URL for rendering an attachment thumbnail without
 * downloading the full-resolution original.
 */
export function getComplaintPhotoThumbnailUrl(
  url: string,
  size = 256,
): string {
  return url.replace(
    "/image/upload/",
    `/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`,
  );
}

function toComplaintPhoto(asset: CloudinaryUploadedAsset): ComplaintPhoto {
  return { url: asset.secure_url, publicId: asset.public_id };
}

export async function uploadComplaintPhoto(
  file: File,
  options: ComplaintPhotoUploadOptions = {},
): Promise<ComplaintPhoto> {
  const asset = await uploadFileToCloudinary({
    file,
    folder: COMPLAINT_PHOTO_FOLDER,
    signal: options.signal,
    onUploadProgress: options.onUploadProgress,
  });

  return toComplaintPhoto(asset);
}
