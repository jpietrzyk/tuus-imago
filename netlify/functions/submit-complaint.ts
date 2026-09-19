import { createServiceClient } from "./_shared/supabase-auth";
import { isRateLimitExceeded, rateLimitResponse } from "./_shared/rate-limit";

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
};

const ALLOWED_TYPES = new Set([
  "damaged",
  "defective",
  "wrong",
  "missing",
  "quality",
  "other",
]);

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  let parsed: SubmitComplaintPayload;
  try {
    parsed = JSON.parse(event.body || "{}") as SubmitComplaintPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid request payload." });
  }

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

  if (!name || !email || !orderNumber || !complaintType || !description) {
    return jsonResponse(400, { error: "Missing required complaint fields." });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, { error: "Invalid email address." });
  }

  if (!ALLOWED_TYPES.has(complaintType)) {
    return jsonResponse(400, { error: "Invalid complaint type." });
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

  const { error: insertError } = await supabase.from("complaints").insert({
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
  });

  if (insertError) {
    console.error("[submit-complaint] insert failed:", insertError.message);
    return jsonResponse(500, { error: "Could not submit the complaint." });
  }

  return jsonResponse(200, { ok: true });
};
