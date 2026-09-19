import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Per-order bearer secret that binds the guest payment/status endpoints to the
 * browser that created the order. Orders created before this existed have a
 * null token and get a bounded, time-limited fallback instead.
 */
export function generateOrderAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export type LegacyOrderContext = {
  createdAt?: string | null;
  paymentStatus?: string | null;
};

/** Legacy fallback is allowed only for recently created, still-unpaid orders. */
export const LEGACY_ORDER_ACCESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function verifyOrderAccess(
  storedToken: string | null | undefined,
  providedToken: string | null | undefined,
  legacyContext?: LegacyOrderContext,
): boolean {
  if (!storedToken) {
    if (!legacyContext) {
      return false;
    }

    const { createdAt, paymentStatus } = legacyContext;
    if (paymentStatus !== "pending" && paymentStatus !== "registered") {
      return false;
    }

    if (!createdAt) {
      return false;
    }

    const createdMs = Date.parse(createdAt);
    if (!Number.isFinite(createdMs)) {
      return false;
    }

    return Date.now() - createdMs <= LEGACY_ORDER_ACCESS_WINDOW_MS;
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
