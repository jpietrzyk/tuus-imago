import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Per-order bearer secret that binds the guest payment/status endpoints to the
 * browser that created the order. Orders created before this existed have a
 * null token and keep the legacy UUID-only behavior.
 */
export function generateOrderAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function verifyOrderAccess(
  storedToken: string | null | undefined,
  providedToken: string | null | undefined,
): boolean {
  // Legacy order: no token was ever issued.
  if (!storedToken) {
    return true;
  }

  if (!providedToken) {
    return false;
  }

  const storedBuffer = Buffer.from(storedToken);
  const providedBuffer = Buffer.from(providedToken);

  if (storedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, providedBuffer);
}
