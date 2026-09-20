import { createServiceClient } from "./_shared/supabase-auth";
import { isRateLimitExceeded, rateLimitResponse } from "./_shared/rate-limit";
import { filledHoneypotField, trackBotDetection } from "./_shared/bot-detection";
import { withSentry } from "./_shared/sentry";
import { COMPLAINT_PHOTO_MAX_COUNT } from "../../src/lib/complaint-limits";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

type SubmitComplaintPayload = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  orderNumber?: string;
  orderDate?: string;
  product?: string;
  complaintType?: string;
  description?: string;
  resolution?: string;
  photos?: unknown;
};

const ALLOWED_TYPES = new Set([
  "damaged",
  "defective",
  "wrong",
  "missing",
  "quality",
  "other",
]);

const MAX_COMPLAINT_PHOTOS = COMPLAINT_PHOTO_MAX_COUNT;

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

/**
 * Photos are uploaded straight to Cloudinary from the browser, so the function
 * never sees the bytes. Accept only a small list of Cloudinary image URLs from
 * the configured cloud (fail closed when that cloud is unknown) and re-validate
 * before persisting, so a forged request cannot store arbitrary URLs or
 * unbounded payloads.
 */
function sanitizePhotos(
  value: unknown,
): { url: string; public_id: string }[] | null {
  if (value === undefined || value === null) return [];

  if (!Array.isArray(value) || value.length > MAX_COMPLAINT_PHOTOS) {
    return null;
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (value.length > 0 && !cloudName) return null;

  const photos: { url: string; public_id: string }[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;

    const url = clean((entry as { url?: unknown }).url, 500);
    const publicId = clean((entry as { public_id?: unknown }).public_id, 300);

    if (!url || !publicId) return null;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "res.cloudinary.com") return null;
    if (!parsed.pathname.startsWith(`/${cloudName}/image/upload/`)) return null;

    photos.push({ url, public_id: publicId });
  }

  return photos;
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

const handlerImpl = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  let parsed: SubmitComplaintPayload;
  try {
    parsed = JSON.parse(event.body || "{}") as SubmitComplaintPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid request payload." });
  }

  // Honeypot: real users never fill these hidden fields. Inspect them here,
  // but only act after the rate limiter so bot hits cannot bypass the throttle
  // while generating Sentry/log events.
  const honeypot = filledHoneypotField(parsed as Record<string, unknown>);

  const name = clean(parsed.name, 200);
  const email = clean(parsed.email, 320);
  const phone = clean(parsed.phone, 40) || null;
  const address = clean(parsed.address, 500) || null;
  const orderNumber = clean(parsed.orderNumber, 100);
  const orderDate = clean(parsed.orderDate, 20) || null;
  const product = clean(parsed.product, 300) || null;
  const complaintType = clean(parsed.complaintType, 40);
  const description = clean(parsed.description, 5000);
  const resolution = clean(parsed.resolution, 5000) || null;
  const photos = sanitizePhotos(parsed.photos);

  if (!name || !email || !orderNumber || !complaintType || !description) {
    return jsonResponse(400, { error: "Missing required complaint fields." });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, { error: "Invalid email address." });
  }

  if (!ALLOWED_TYPES.has(complaintType)) {
    return jsonResponse(400, { error: "Invalid complaint type." });
  }

  if (photos === null) {
    return jsonResponse(400, { error: "Invalid complaint photos." });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[submit-complaint] client init failed:", e);
    return jsonResponse(500, { error: "Complaints are unavailable." });
  }

  if (
    await isRateLimitExceeded(supabase, event, {
      scope: "submit-complaint",
      limit: 5,
      windowSeconds: 600,
    })
  ) {
    return rateLimitResponse(600);
  }

  // Silently drop honeypot hits with a fake success so bots learn nothing.
  if (honeypot) {
    trackBotDetection("submit-complaint", honeypot);
    return jsonResponse(200, { ok: true });
  }

  const insertPayload: Record<string, unknown> = {
    name,
    email,
    phone,
    address,
    order_number: orderNumber,
    order_date: orderDate,
    product,
    complaint_type: complaintType,
    description,
    resolution,
  };

  // Omit `photos` when empty so a submission made before migration
  // 202609200001 is applied still succeeds without the new column.
  if (photos.length > 0) {
    insertPayload.photos = photos;
  }

  const { error: insertError } = await supabase
    .from("complaints")
    .insert(insertPayload);

  if (insertError) {
    console.error("[submit-complaint] insert failed:", insertError.message);
    return jsonResponse(500, { error: "Could not submit the complaint." });
  }

  return jsonResponse(200, { ok: true });
};

export const handler = withSentry("submit-complaint", handlerImpl);
