import { createServiceClient } from "./_shared/supabase-auth";
import { isRateLimitExceeded, rateLimitResponse } from "./_shared/rate-limit";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

type TrackReferralPayload = {
  ref_code?: string;
  path?: string;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let parsed: TrackReferralPayload;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const refCode = parsed.ref_code?.trim();
  if (!refCode) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, tracked: false }),
    };
  }

  if (refCode.length > 100) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, tracked: false }),
    };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[track-referral] client init failed:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Tracking is unavailable." }),
    };
  }

  if (
    await isRateLimitExceeded(supabase, event, {
      scope: "track-referral",
      limit: 30,
      windowSeconds: 60,
    })
  ) {
    return rateLimitResponse(60);
  }

  const { data: refRow, error: refError } = await supabase
    .from("partner_refs")
    .select("id")
    .eq("ref_code", refCode)
    .eq("is_active", true)
    .single();

  if (refError || !refRow) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, tracked: false }),
    };
  }

  const userAgent = (event.headers?.["user-agent"] ?? null)?.slice(0, 500) ?? null;
  const path = typeof parsed.path === "string" ? parsed.path.slice(0, 500) : null;

  const { error: insertError } = await supabase
    .from("referral_events")
    .insert({
      partner_ref_id: refRow.id,
      path,
      user_agent: userAgent,
    });

  if (insertError) {
    console.error("[track-referral] insert failed:", insertError.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not record referral event." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, tracked: true }),
  };
};
