import { createHash } from "node:crypto";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
};

type ParamsToSign = Record<string, string | number | boolean>;

function buildSignaturePayload(params: ParamsToSign): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const hasVitePrefixedServerVars =
    !!process.env.VITE_CLOUDINARY_API_KEY ||
    !!process.env.VITE_CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    const details = hasVitePrefixedServerVars
      ? "Detected VITE_CLOUDINARY_* vars. For Netlify Functions, use non-prefixed CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET server env vars."
      : "Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Netlify server environment.";

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in server environment. ${details}`,
      }),
    };
  }

  try {
    const parsedBody = JSON.parse(event.body || "{}");
    const paramsToSign =
      (parsedBody.paramsToSign as ParamsToSign | undefined) || {};

    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = buildSignaturePayload({
      ...paramsToSign,
      timestamp,
    });

    const signature = createHash("sha1")
      .update(`${signaturePayload}${apiSecret}`)
      .digest("hex");

    return {
      statusCode: 200,
      body: JSON.stringify({
        signature,
        timestamp,
        apiKey,
      }),
    };
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request payload" }),
    };
  }
};
