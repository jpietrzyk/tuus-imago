import { createClient, type User } from "@supabase/supabase-js";

type NetlifyEvent = {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined>;
};

type AdminApiRequest = {
  resource?: string;
  id?: string;
  data?: Record<string, unknown>;
  meta?: {
    select?: string;
    filters?: Array<{ field: string; operator: string; value: unknown }>;
    pagination?: { current?: number; pageSize?: number };
    sorters?: Array<{ field: string; order: "asc" | "desc" }>;
    aggregate?: string;
    aggregateFunction?: string;
    groupBy?: string;
  };
};

type ShipmentStatus =
  | "pending_fulfillment"
  | "in_transit"
  | "delivered"
  | "failed_delivery"
  | "returned";

const ALLOWED_RESOURCES = new Set([
  "orders",
  "order_items",
  "order_status_history",
  "coupons",
  "coupon_usages",
  "profiles",
]);

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending_fulfillment: ["in_transit", "failed_delivery", "returned"],
  in_transit: ["delivered", "failed_delivery", "returned"],
  delivered: ["returned"],
  failed_delivery: ["in_transit", "returned"],
  returned: [],
};

const ALLOWED_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending_fulfillment",
  "in_transit",
  "delivered",
  "failed_delivery",
  "returned",
];

function isShipmentStatus(value: string): value is ShipmentStatus {
  return ALLOWED_SHIPMENT_STATUSES.includes(value as ShipmentStatus);
}

function getAuthHeader(event: NetlifyEvent): string | null {
  const authHeader = event.headers?.["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

async function getAuthenticatedAdmin(
  event: NetlifyEvent,
): Promise<
  { user: User; supabase: ReturnType<typeof createClient> } | { error: { statusCode: number; body: string } }
> {
  const token = getAuthHeader(event);
  if (!token) {
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing authorization token." }),
      },
    };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabasePublishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      error: {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase configuration." }),
      },
    };
  }

  const authClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token." }),
      },
    };
  }

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return {
      error: {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden: not an admin user." }),
      },
    };
  }

  return { user: data.user, supabase: authClient };
}

function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function applyFilters(
  query: ReturnType<ReturnType<typeof createClient>["from"]>,
  filters?: Array<{ field: string; operator: string; value: unknown }>,
) {
  if (!filters) return query;

  for (const filter of filters) {
    const { field, operator, value } = filter;

    switch (operator) {
      case "eq":
        query = query.eq(field, value as string | boolean | number);
        break;
      case "ne":
        query = query.neq(field, value as string | boolean | number);
        break;
      case "lt":
        query = query.lt(field, value as string | number);
        break;
      case "lte":
        query = query.lte(field, value as string | number);
        break;
      case "gt":
        query = query.gt(field, value as string | number);
        break;
      case "gte":
        query = query.gte(field, value as string | number);
        break;
      case "in":
        query = query.in(field, value as string[]);
        break;
      case "contains":
      case "containss":
        query = query.like(field, `%${value as string}%`);
        break;
      case "startswith":
      case "startswiths":
        query = query.like(field, `${value as string}%`);
        break;
      case "endswith":
      case "endswiths":
        query = query.like(field, `%${value as string}`);
        break;
      case "null":
        query = query.is(field, value ? null : "not.null");
        break;
      case "nnull":
        query = query.is(field, value ? "not.null" : null);
        break;
      default:
        query = query.eq(field, value as string | boolean | number);
    }
  }

  return query;
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

export const handler = async (event: NetlifyEvent) => {
  const adminResult = await getAuthenticatedAdmin(event);
  if ("error" in adminResult) {
    return {
      statusCode: adminResult.error.statusCode,
      body: adminResult.error.body,
    };
  }

  const supabase = createAdminClient();
  const method = (event.httpMethod ?? "GET").toUpperCase();

  let requestPayload: AdminApiRequest = {};

  if (method === "GET") {
    const qs = event.queryStringParameters ?? {};
    requestPayload = {
      resource: qs.resource,
      id: qs.id,
      meta: {
        select: qs.select,
        filters: qs.filters ? JSON.parse(qs.filters) : undefined,
        pagination: qs.pagination
          ? JSON.parse(qs.pagination)
          : undefined,
        sorters: qs.sorters ? JSON.parse(qs.sorters) : undefined,
        aggregate: qs.aggregate,
        aggregateFunction: qs.aggregateFunction,
        groupBy: qs.groupBy,
      },
    };
  } else {
    try {
      requestPayload = JSON.parse(event.body ?? "{}");
    } catch {
      return jsonResponse(400, { error: "Invalid request body." });
    }
  }

  const { resource, id, data, meta } = requestPayload;

  if (!resource || !ALLOWED_RESOURCES.has(resource)) {
    return jsonResponse(400, {
      error: `Invalid resource. Allowed: ${[...ALLOWED_RESOURCES].join(", ")}.`,
    });
  }

  try {
    switch (method) {
      case "GET": {
        const selectFields = meta?.select ?? "*";
        const pageSize = meta?.pagination?.pageSize ?? 25;
        const currentPage = meta?.pagination?.current ?? 1;
        const offset = (currentPage - 1) * pageSize;

        if (id) {
          let query = supabase
            .from(resource)
            .select(selectFields)
            .eq("id", id);

          if (meta?.sorters?.length) {
            for (const sorter of meta.sorters) {
              query = query.order(sorter.field, {
                ascending: sorter.order === "asc",
              });
            }
          }

          const { data: record, error } = await query.maybeSingle();

          if (error) {
            return jsonResponse(500, { error: error.message });
          }

          if (!record) {
            return jsonResponse(404, { error: "Record not found." });
          }

          return jsonResponse(200, { data: record });
        }

        let query = supabase.from(resource).select(selectFields, {
          count: "exact",
        });

        query = applyFilters(query, meta?.filters);

        if (meta?.sorters?.length) {
          for (const sorter of meta.sorters) {
            query = query.order(sorter.field, {
              ascending: sorter.order === "asc",
            });
          }
        } else {
          query = query.order("created_at", { ascending: false });
        }

        query = query.range(offset, offset + pageSize - 1);

        const { data: records, error, count } = await query;

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        return jsonResponse(200, {
          data: records ?? [],
          total: count ?? 0,
        });
      }

      case "POST": {
        if (resource === "orders" && meta?.aggregate) {
          return handleAggregation(supabase, resource, meta);
        }

        if (!data) {
          return jsonResponse(400, { error: "Missing data payload." });
        }

        const { data: created, error } = await supabase
          .from(resource)
          .insert(data)
          .select()
          .single();

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        return jsonResponse(201, { data: created });
      }

      case "PATCH":
      case "PUT": {
        if (!id) {
          return jsonResponse(400, { error: "Missing record id." });
        }

        if (
          resource === "orders" &&
          data?.shipment_status &&
          typeof data.shipment_status === "string"
        ) {
          return handleShipmentUpdate(supabase, id, data);
        }

        if (!data) {
          return jsonResponse(400, { error: "Missing data payload." });
        }

        const { data: updated, error } = await supabase
          .from(resource)
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        if (!updated) {
          return jsonResponse(404, { error: "Record not found." });
        }

        return jsonResponse(200, { data: updated });
      }

      case "DELETE": {
        if (!id) {
          return jsonResponse(400, { error: "Missing record id." });
        }

        const { error } = await supabase
          .from(resource)
          .delete()
          .eq("id", id);

        if (error) {
          return jsonResponse(500, { error: error.message });
        }

        return jsonResponse(200, { data: { id } });
      }

      default:
        return jsonResponse(405, { error: "Method Not Allowed" });
    }
  } catch (err) {
    console.error("[admin-api] Error:", err);
    return jsonResponse(500, { error: "Internal server error." });
  }
};

async function handleAggregation(
  supabase: ReturnType<typeof createClient>,
  _resource: string,
  meta: NonNullable<AdminApiRequest["meta"]>,
) {
  const aggregateFunction = meta.aggregateFunction ?? "count";
  const groupBy = meta.groupBy;

  if (aggregateFunction === "count" && groupBy) {
    const { data, error } = await supabase
      .from("orders")
      .select(groupBy);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const grouped = new Map<string, number>();
    for (const row of data ?? []) {
      const key = String(row[groupBy] ?? "unknown");
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    const result = Array.from(grouped.entries()).map(([key, count]) => ({
      [groupBy]: key,
      count,
    }));

    return jsonResponse(200, { data: result });
  }

  if (aggregateFunction === "sum" && groupBy) {
    const sumField = meta.aggregate ?? "total_price";
    const { data, error } = await supabase
      .from("orders")
      .select(`${groupBy}, ${sumField}`);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const grouped = new Map<string, { sum: number; count: number }>();
    for (const row of data ?? []) {
      const key = String(row[groupBy] ?? "unknown");
      const value = Number(row[sumField]) || 0;
      const existing = grouped.get(key) ?? { sum: 0, count: 0 };
      grouped.set(key, { sum: existing.sum + value, count: existing.count + 1 });
    }

    const result = Array.from(grouped.entries()).map(([key, { sum, count }]) => ({
      [groupBy]: key,
      [sumField]: sum,
      count,
    }));

    return jsonResponse(200, { data: result });
  }

  if (aggregateFunction === "count") {
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    return jsonResponse(200, { data: { count: count ?? 0 } });
  }

  if (aggregateFunction === "sum") {
    const sumField = meta.aggregate ?? "total_price";
    const { data, error } = await supabase
      .from("orders")
      .select(sumField);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const sum = (data ?? []).reduce((acc, row) => acc + (Number(row[sumField]) || 0), 0);

    return jsonResponse(200, { data: { [sumField]: sum } });
  }

  return jsonResponse(400, { error: "Unsupported aggregation." });
}

async function handleShipmentUpdate(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  data: Record<string, unknown>,
) {
  const newStatus = String(data.shipment_status);
  const trackingNumber = data.tracking_number != null ? String(data.tracking_number) : undefined;
  const note = data.note != null ? String(data.note) : undefined;

  if (!isShipmentStatus(newStatus)) {
    return jsonResponse(400, {
      error: `Invalid shipmentStatus. Allowed: ${ALLOWED_SHIPMENT_STATUSES.join(", ")}.`,
    });
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("id, order_number, shipment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError) {
    return jsonResponse(500, { error: "Could not load order." });
  }

  if (!existingOrder) {
    return jsonResponse(404, { error: "Order not found." });
  }

  if (
    !isShipmentStatus(existingOrder.shipment_status) &&
    existingOrder.shipment_status != null
  ) {
    return jsonResponse(500, {
      error: "Order has unsupported current shipment status.",
    });
  }

  const currentStatus = (existingOrder.shipment_status ?? "pending_fulfillment") as ShipmentStatus;
  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];
  const isSameStatus = newStatus === currentStatus;

  if (!isSameStatus && !allowedNextStatuses.includes(newStatus)) {
    return jsonResponse(409, {
      error: `Invalid shipment status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedNextStatuses.join(", ") || "none"}.`,
    });
  }

  const updateFields: Record<string, unknown> = {
    shipment_status: newStatus,
  };
  if (trackingNumber !== undefined) {
    updateFields.tracking_number =
      trackingNumber.length > 0 ? trackingNumber : null;
  }

  const { data: updatedOrder, error: updateOrderError } = await supabase
    .from("orders")
    .update(updateFields)
    .eq("id", orderId)
    .select("id, order_number, shipment_status, tracking_number")
    .single();

  if (updateOrderError || !updatedOrder) {
    return jsonResponse(500, { error: "Could not update shipment." });
  }

  const historyNote =
    note ||
    (isSameStatus
      ? "Shipment details updated."
      : `Shipment status changed from ${currentStatus} to ${newStatus}.`);

  const { error: historyError } = await supabase
    .from("order_status_history")
    .insert({
      order_id: orderId,
      status_type: "shipment",
      status: newStatus,
      note: historyNote,
    });

  if (historyError) {
    return jsonResponse(500, {
      error: "Shipment updated but history insert failed.",
    });
  }

  return jsonResponse(200, {
    data: updatedOrder,
    meta: {
      allowedNextShipmentStatuses: STATUS_TRANSITIONS[newStatus] ?? [],
    },
  });
}
