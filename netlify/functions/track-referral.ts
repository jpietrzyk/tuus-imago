import { createServiceClient } from "./_shared/supabase-auth";

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

  const supabase = createServiceClient();

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

  const userAgent = event.headers?.["user-agent"] ?? null;

  const { error: insertError } = await supabase
    .from("referral_events")
    .insert({
      partner_ref_id: refRow.id,
      path: parsed.path ?? null,
      user_agent: userAgent,
    });

  if (insertError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: insertError.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, tracked: true }),
  };
};
