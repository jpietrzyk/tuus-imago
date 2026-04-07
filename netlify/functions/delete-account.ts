import { getAuthenticatedUser, createServiceClient } from "./_shared/supabase-auth";

type NetlifyEvent = {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const authResult = await getAuthenticatedUser(event);
  if ("error" in authResult) return authResult.error;

  const userId = authResult.user.id;
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: "Deleted User",
      phone: null,
      deleted_at: now,
    })
    .eq("id", userId);

  if (profileError) {
    console.error("[delete-account] Failed to anonymize profile:", profileError.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not delete account." }) };
  }

  const { error: addressesError } = await supabase
    .from("addresses")
    .delete()
    .eq("user_id", userId);

  if (addressesError) {
    console.error("[delete-account] Failed to delete addresses:", addressesError.message);
  }

  const { error: ordersError } = await supabase
    .from("orders")
    .update({
      customer_name: "Deleted User",
      customer_phone: null,
      user_id: null,
    })
    .eq("user_id", userId);

  if (ordersError) {
    console.error("[delete-account] Failed to anonymize orders:", ordersError.message);
  }

  const adminAuth = createServiceClient();
  const { error: authDeleteError } = await adminAuth.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error("[delete-account] Failed to delete auth user:", authDeleteError.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not fully delete account." }) };
  }

  return { statusCode: 200, body: JSON.stringify({ status: "deleted" }) };
};
