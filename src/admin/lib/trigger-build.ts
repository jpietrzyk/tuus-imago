import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

export interface TriggerBuildResult {
  ok: boolean;
  statusCode: number;
  error?: string;
}

export async function triggerBuild(): Promise<TriggerBuildResult> {
  const headers = await getAuthHeaders();
  const response = await fetch("/.netlify/functions/trigger-build", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    return {
      ok: false,
      statusCode: response.status,
      error: body.error,
    };
  }

  return { ok: true, statusCode: response.status };
}
