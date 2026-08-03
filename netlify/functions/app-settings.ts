import { createServiceClient } from "./_shared/supabase-auth";

// Canonical defaults for the DPI settings. Keep in sync with:
//  - supabase/migrations/202608030001_create_app_settings.sql (seed values)
//  - src/components/image-uploader/image-dpi-rules.ts (DEFAULT_DPI_THRESHOLD)
const DEFAULTS = {
  dpiGuardEnabled: true,
  dpiThreshold: 72,
};

const SETTING_KEYS = ["dpi_guard", "dpi_threshold"] as const;

type AppSettingRow = {
  key: string;
  value: string;
  data_type: "boolean" | "integer" | "number" | "string";
};

function ok(body: unknown, cacheSeconds = 60) {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheSeconds}`,
    },
  };
}

export const handler = async (event: { httpMethod?: string }) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[app-settings] client init failed:", e);
    return ok(DEFAULTS);
  }

  const { data: rows, error } = await supabase
    .from("app_settings")
    .select("key, value, data_type")
    .in("key", [...SETTING_KEYS]);

  if (error) {
    console.error("[app-settings] query failed:", error.message);
    return ok(DEFAULTS);
  }

  const byKey = new Map<string, AppSettingRow>(
    (rows ?? []).map((row: AppSettingRow) => [row.key, row]),
  );

  const guardRow = byKey.get("dpi_guard");
  const thresholdRow = byKey.get("dpi_threshold");

  const dpiGuardEnabled =
    guardRow && guardRow.data_type === "boolean"
      ? guardRow.value === "true"
      : DEFAULTS.dpiGuardEnabled;

  const thresholdParsed =
    thresholdRow && thresholdRow.data_type === "integer"
      ? parseInt(thresholdRow.value, 10)
      : NaN;
  const dpiThreshold = Number.isFinite(thresholdParsed)
    ? thresholdParsed
    : DEFAULTS.dpiThreshold;

  return ok({ dpiGuardEnabled, dpiThreshold });
};
