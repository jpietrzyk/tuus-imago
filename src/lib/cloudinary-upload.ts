import {
  cloudinaryConfig,
  getCloudinaryUploadConfigError,
} from "@/lib/cloudinary";
import {
  getTransformedPreviewUrl,
  type ImageTransformations,
} from "@/lib/image-transformations";

const CLOUDINARY_UPLOAD_FOLDER = "tuus-imago";

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
}

export interface CloudinaryUploadedAsset {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  url: string;
  custom_coordinates?: string;
  context?: string;
}

export interface CloudinaryDirectUploadInput {
  file: File;
  transformations: ImageTransformations;
  context?: string;
  signal?: AbortSignal;
  onUploadProgress?: (fraction: number) => void;
}

export interface CloudinaryDirectUploadResult {
  asset: CloudinaryUploadedAsset;
  transformedUrl: string;
  transformations: ImageTransformations;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  return data;
}

async function requestUploadSignature(
  paramsToSign: Record<string, string>,
  signal?: AbortSignal,
): Promise<CloudinarySignatureResponse> {
  const response = await fetch("/.netlify/functions/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paramsToSign }),
    signal,
  });

  const data = await parseJsonResponse<
    CloudinarySignatureResponse | { error: string }
  >(response);

  if (!response.ok || "error" in data) {
    throw new Error(
      "error" in data ? data.error : "Could not sign Cloudinary upload.",
    );
  }

  return data;
}

export async function uploadImageToCloudinary({
  file,
  transformations,
  context,
  signal,
  onUploadProgress,
}: CloudinaryDirectUploadInput): Promise<CloudinaryDirectUploadResult> {
  const configError = getCloudinaryUploadConfigError();

  if (configError) {
    throw new Error(configError);
  }

  const paramsToSign: Record<string, string> = {
    folder: CLOUDINARY_UPLOAD_FOLDER,
    upload_preset: cloudinaryConfig.uploadPreset,
  };

  if (context) {
    paramsToSign.context = context;
  }

  const { signature, timestamp, apiKey } = await requestUploadSignature(
    paramsToSign,
    signal,
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", CLOUDINARY_UPLOAD_FOLDER);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);

  if (context) {
    formData.append("context", context);
  }

  const data = await new Promise<
    CloudinaryUploadedAsset | { error?: { message?: string } }
  >((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    );
    xhr.responseType = "json";

    xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
      if (!onUploadProgress || !event.lengthComputable) {
        return;
      }

      const fraction = Math.min(
        Math.max(event.loaded / event.total, 0),
        1,
      );
      onUploadProgress(fraction);
    };

    xhr.onerror = () => {
      reject(new Error("Cloudinary upload failed."));
    };

    xhr.onload = () => {
      const responseData = xhr.response as
        | CloudinaryUploadedAsset
        | { error?: { message?: string } }
        | null;

      if (!responseData) {
        reject(new Error("Cloudinary upload failed."));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            "error" in responseData && responseData.error?.message
              ? responseData.error.message
              : "Cloudinary upload failed.",
          ),
        );
        return;
      }

      onUploadProgress?.(1);
      resolve(responseData);
    };

    if (signal) {
      const abortHandler = () => {
        xhr.abort();
        reject(new DOMException("Upload aborted.", "AbortError"));
      };

      if (signal.aborted) {
        abortHandler();
        return;
      }

      signal.addEventListener("abort", abortHandler, { once: true });
      xhr.addEventListener(
        "loadend",
        () => {
          signal.removeEventListener("abort", abortHandler);
        },
        { once: true },
      );
    }

    xhr.send(formData);
  });

  if (!("secure_url" in data)) {
    throw new Error(
      "error" in data && data.error?.message
        ? data.error.message
        : "Cloudinary upload failed.",
    );
  }

  return {
    asset: data,
    transformedUrl: getTransformedPreviewUrl(
      data.secure_url,
      transformations,
    ),
    transformations,
  };
}
