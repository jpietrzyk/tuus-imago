import { createHash } from "node:crypto";

export type P24Config = {
  merchantId: number;
  posId: number;
  crc: string;
  apiKey: string;
  apiBaseUrl: string;
  panelBaseUrl: string;
  siteUrl: string;
  statusUrl: string;
};

export type P24NotificationPayload = {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
};

function normalizeUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function buildP24Sign(payload: Record<string, string | number | boolean>) {
  return createHash("sha384").update(JSON.stringify(payload)).digest("hex");
}

export function toMinorUnits(amount: number | string): number {
  const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (!Number.isFinite(numeric)) {
    throw new Error("Invalid amount.");
  }

  return Math.round(numeric * 100);
}

export function getP24Config(): P24Config {
  const merchantId = Number.parseInt(process.env.P24_MERCHANT_ID ?? "", 10);
  const posId = Number.parseInt(process.env.P24_POS_ID ?? "", 10);
  const crc = process.env.P24_CRC?.trim();
  const apiKey = process.env.P24_API_KEY?.trim();
  const apiBaseUrl = normalizeUrl(
    process.env.P24_API_BASE_URL?.trim() || "https://sandbox.przelewy24.pl/api/v1",
  );
  const siteUrl = normalizeUrl(
    process.env.SITE_URL?.trim() || process.env.URL?.trim() || "",
  );
  const statusUrl = process.env.P24_STATUS_URL?.trim()
    || (siteUrl ? `${siteUrl}/.netlify/functions/przelewy24-webhook` : "");

  if (!Number.isInteger(merchantId) || !Number.isInteger(posId) || !crc || !apiKey || !siteUrl) {
    throw new Error(
      "Missing P24_MERCHANT_ID, P24_POS_ID, P24_CRC, P24_API_KEY, or SITE_URL in environment.",
    );
  }

  return {
    merchantId,
    posId,
    crc,
    apiKey,
    apiBaseUrl,
    panelBaseUrl: apiBaseUrl.replace(/\/api\/v1$/, ""),
    siteUrl,
    statusUrl,
  };
}

export function buildP24AuthHeader(posId: number, apiKey: string) {
  return `Basic ${Buffer.from(`${posId}:${apiKey}`).toString("base64")}`;
}

export function buildRegisterSign(args: {
  sessionId: string;
  merchantId: number;
  amount: number;
  currency: string;
  crc: string;
}) {
  return buildP24Sign({
    sessionId: args.sessionId,
    merchantId: args.merchantId,
    amount: args.amount,
    currency: args.currency,
    crc: args.crc,
  });
}

export function buildVerifySign(args: {
  sessionId: string;
  orderId: number;
  amount: number;
  currency: string;
  crc: string;
}) {
  return buildP24Sign({
    sessionId: args.sessionId,
    orderId: args.orderId,
    amount: args.amount,
    currency: args.currency,
    crc: args.crc,
  });
}

export function buildNotificationSign(args: Omit<P24NotificationPayload, "sign"> & { crc: string }) {
  return buildP24Sign({
    merchantId: args.merchantId,
    posId: args.posId,
    sessionId: args.sessionId,
    amount: args.amount,
    originAmount: args.originAmount,
    currency: args.currency,
    orderId: args.orderId,
    methodId: args.methodId,
    statement: args.statement,
    crc: args.crc,
  });
}

export function buildReturnUrl(siteUrl: string, orderId: string) {
  const url = new URL("/checkout", siteUrl);
  url.searchParams.set("payment", "return");
  url.searchParams.set("orderId", orderId);
  return url.toString();
}

export async function parseRequestJson<T>(body: string | null | undefined): Promise<T> {
  return JSON.parse(body || "{}") as T;
}

export async function parseP24Response<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}
