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
    export?: boolean;
    bulkAction?: string;
  };
  ids?: string[];
};

type ShipmentStatus =
  | "pending_fulfillment"
  | "in_transit"
  | "delivered"
  | "failed_delivery"
  | "returned";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

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

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["cancelled", "refunded"],
  cancelled: [],
  refunded: [],
};

const ALLOWED_ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "cancelled",
  "refunded",
];

function isShipmentStatus(value: string): value is ShipmentStatus {
  return ALLOWED_SHIPMENT_STATUSES.includes(value as ShipmentStatus);
}

function isOrderStatus(value: string): value is OrderStatus {
  return ALLOWED_ORDER_STATUSES.includes(value as OrderStatus);
}

function getAuthHeader(event: NetlifyEvent): string | null {
  const authHeader = event.headers?.["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
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

function csvResponse(filename: string, csv: string) {
  return {
    statusCode: 200,
    body: csv,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  };
}

function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(",");
}

export const handler = async (event: NetlifyEvent) => {
  const token = getAuthHeader(event);

  if (!token) {
    return jsonResponse(401, { error: "Missing authorization token.", debug: "no_auth_header" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !apiKey) {
    return jsonResponse(500, { error: "Missing Supabase configuration.", debug: { hasUrl: !!supabaseUrl, hasKey: !!apiKey } });
  }

  let user: User | null = null;
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: apiKey,
      },
    });

    if (!authResponse.ok) {
      const body = await authResponse.text();
      return jsonResponse(401, { error: "Invalid or expired token.", debug: { status: authResponse.status, body: body.slice(0, 300) } });
    }

    user = (await authResponse.json()) as User;
  } catch (err) {
    return jsonResponse(500, { error: "Auth request failed.", debug: String(err) });
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return jsonResponse(403, { error: "Forbidden: not an admin user.", debug: { userId: user.id, profileError: profileError?.message } });
  }

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
        if (meta?.export) {
          return handleExport(adminClient, resource, meta);
        }

        const selectFields = meta?.select ?? "*";
        const pageSize = meta?.pagination?.pageSize ?? 25;
        const currentPage = meta?.pagination?.current ?? 1;
        const offset = (currentPage - 1) * pageSize;

        if (id) {
          let query = adminClient
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

        let query = adminClient.from(resource).select(selectFields, {
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
          return handleAggregation(adminClient, resource, meta);
        }

        if (meta?.aggregateFunction) {
          return handleAggregation(adminClient, resource, meta);
        }

        if (meta?.bulkAction === "update_status" && resource === "orders") {
          return handleBulkStatusUpdate(adminClient, data);
        }

        if (meta?.export) {
          return handleExport(adminClient, resource, meta);
        }

        if (!data) {
          return jsonResponse(400, { error: "Missing data payload." });
        }

        const { data: created, error } = await adminClient
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
          return handleShipmentUpdate(adminClient, id, data);
        }

        if (
          resource === "orders" &&
          data?.status &&
          typeof data.status === "string"
        ) {
          return handleOrderStatusUpdate(adminClient, id, data);
        }

        if (!data) {
          return jsonResponse(400, { error: "Missing data payload." });
        }

        const { data: updated, error } = await adminClient
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

        const { error } = await adminClient
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

  if (aggregateFunction === "customer_list") {
    return handleCustomerList(supabase);
  }

  if (aggregateFunction === "revenue_over_time") {
    return handleRevenueOverTime(supabase, meta);
  }

  if (aggregateFunction === "revenue_by_month") {
    return handleRevenueByMonth(supabase);
  }

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

async function handleCustomerList(
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from("orders")
    .select("customer_email, customer_name, total_price, marketing_consent, created_at");

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  const customerMap = new Map<string, {
    customer_email: string;
    customer_name: string;
    order_count: number;
    total_revenue: number;
    last_order_date: string;
    marketing_consent: boolean;
  }>();

  for (const row of data ?? []) {
    const email = row.customer_email;
    const existing = customerMap.get(email);
    if (existing) {
      existing.order_count += 1;
      existing.total_revenue += Number(row.total_price) || 0;
      if (new Date(row.created_at) > new Date(existing.last_order_date)) {
        existing.last_order_date = row.created_at;
        existing.customer_name = row.customer_name;
      }
      if (row.marketing_consent) {
        existing.marketing_consent = true;
      }
    } else {
      customerMap.set(email, {
        customer_email: email,
        customer_name: row.customer_name,
        order_count: 1,
        total_revenue: Number(row.total_price) || 0,
        last_order_date: row.created_at,
        marketing_consent: row.marketing_consent ?? false,
      });
    }
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime(),
  );

  return jsonResponse(200, { data: customers });
}

async function handleRevenueOverTime(
  supabase: ReturnType<typeof createClient>,
  meta: NonNullable<AdminApiRequest["meta"]>,
) {
  const days = typeof meta.aggregate === "string" ? parseInt(meta.aggregate, 10) : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_price")
    .gte("created_at", since.toISOString());

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  const dayMap = new Map<string, { date: string; revenue: number; count: number }>();
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const existing = dayMap.get(day) ?? { date: day, revenue: 0, count: 0 };
    existing.revenue += Number(row.total_price) || 0;
    existing.count += 1;
    dayMap.set(day, existing);
  }

  const result = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return jsonResponse(200, { data: result });
}

async function handleRevenueByMonth(
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_price");

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  const monthMap = new Map<string, { month: string; revenue: number; count: number }>();
  for (const row of data ?? []) {
    const month = (row.created_at as string).slice(0, 7);
    const existing = monthMap.get(month) ?? { month, revenue: 0, count: 0 };
    existing.revenue += Number(row.total_price) || 0;
    existing.count += 1;
    monthMap.set(month, existing);
  }

  const result = Array.from(monthMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  return jsonResponse(200, { data: result });
}

async function handleOrderStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  data: Record<string, unknown>,
) {
  const newStatus = String(data.status);
  const note = data.note != null ? String(data.note) : undefined;

  if (!isOrderStatus(newStatus)) {
    return jsonResponse(400, {
      error: `Invalid order status. Allowed: ${ALLOWED_ORDER_STATUSES.join(", ")}.`,
    });
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError) {
    return jsonResponse(500, { error: "Could not load order." });
  }

  if (!existingOrder) {
    return jsonResponse(404, { error: "Order not found." });
  }

  if (!isOrderStatus(existingOrder.status)) {
    return jsonResponse(500, { error: "Order has unsupported current status." });
  }

  const currentStatus = existingOrder.status as OrderStatus;
  const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  const isSameStatus = newStatus === currentStatus;

  if (!isSameStatus && !allowedNextStatuses.includes(newStatus)) {
    return jsonResponse(409, {
      error: `Invalid order status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedNextStatuses.join(", ") || "none"}.`,
    });
  }

  const { data: updatedOrder, error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)
    .select("id, order_number, status")
    .single();

  if (updateOrderError || !updatedOrder) {
    return jsonResponse(500, { error: "Could not update order status." });
  }

  const historyNote =
    note ||
    (isSameStatus
      ? "Order status unchanged."
      : `Order status changed from ${currentStatus} to ${newStatus}.`);

  const { error: historyError } = await supabase
    .from("order_status_history")
    .insert({
      order_id: orderId,
      status_type: "order",
      status: newStatus,
      note: historyNote,
    });

  if (historyError) {
    return jsonResponse(500, {
      error: "Order status updated but history insert failed.",
    });
  }

  return jsonResponse(200, {
    data: updatedOrder,
    meta: {
      allowedNextStatuses: ORDER_STATUS_TRANSITIONS[newStatus] ?? [],
    },
  });
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

async function handleBulkStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  data?: Record<string, unknown>,
) {
  if (!data) {
    return jsonResponse(400, { error: "Missing data payload." });
  }

  const ids = data.ids as string[] | undefined;
  const status = data.status as string | undefined;

  if (!Array.isArray(ids) || ids.length === 0) {
    return jsonResponse(400, { error: "Missing or empty ids array." });
  }

  if (!status || !isOrderStatus(status)) {
    return jsonResponse(400, {
      error: `Invalid status. Allowed: ${ALLOWED_ORDER_STATUSES.join(", ")}.`,
    });
  }

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const orderId of ids) {
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (!existingOrder) {
      failed += 1;
      errors.push(`Order ${orderId}: not found.`);
      continue;
    }

    const currentStatus = existingOrder.status as OrderStatus;
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(status) && status !== currentStatus) {
      failed += 1;
      errors.push(`Order ${orderId}: cannot transition from ${currentStatus} to ${status}.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateError) {
      failed += 1;
      errors.push(`Order ${orderId}: ${updateError.message}`);
      continue;
    }

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status_type: "order",
      status,
      note: `Bulk status update to ${status}.`,
    });

    updated += 1;
  }

  return jsonResponse(200, { data: { updated, failed, errors } });
}

async function handleExport(
  supabase: ReturnType<typeof createClient>,
  resource: string,
  meta: NonNullable<AdminApiRequest["meta"]>,
) {
  if (resource === "orders") {
    let query = supabase
      .from("orders")
      .select("order_number,status,customer_name,customer_email,customer_phone,total_price,discount_amount,coupon_code,payment_status,shipment_status,tracking_number,created_at");

    query = applyFilters(query, meta.filters);

    if (meta.sorters?.length) {
      for (const sorter of meta.sorters) {
        query = query.order(sorter.field, { ascending: sorter.order === "asc" });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const header = toCsvRow([
      "Order #", "Status", "Customer Name", "Email", "Phone",
      "Total", "Discount", "Coupon", "Payment", "Shipment", "Tracking", "Created",
    ]);
    const rows = (data ?? []).map((row) =>
      toCsvRow([
        row.order_number, row.status, row.customer_name, row.customer_email,
        row.customer_phone, row.total_price, row.discount_amount, row.coupon_code,
        row.payment_status, row.shipment_status, row.tracking_number, row.created_at,
      ]),
    );

    return csvResponse(`orders-export-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  }

  if (resource === "coupons") {
    const { data, error } = await supabase
      .from("coupons")
      .select("code,description,discount_type,discount_value,currency,min_order_amount,max_uses,used_count,is_active,valid_from,valid_until,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const header = toCsvRow([
      "Code", "Description", "Type", "Value", "Currency",
      "Min Order", "Max Uses", "Used Count", "Active", "Valid From", "Valid Until",
    ]);
    const rows = (data ?? []).map((row) =>
      toCsvRow([
        row.code, row.description, row.discount_type, row.discount_value,
        row.currency, row.min_order_amount, row.max_uses, row.used_count,
        row.is_active, row.valid_from, row.valid_until,
      ]),
    );

    return csvResponse(`coupons-export-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  }

  if (resource === "customers") {
    const result = await handleCustomerList(supabase);
    const body = JSON.parse(typeof result.body === "string" ? result.body : "{}");
    const customers = body.data ?? [];

    const header = toCsvRow(["Email", "Name", "Orders", "Revenue", "Last Order", "Marketing"]);
    const rows = customers.map((c: Record<string, unknown>) =>
      toCsvRow([
        c.customer_email, c.customer_name, c.order_count,
        c.total_revenue, c.last_order_date, c.marketing_consent,
      ]),
    );

    return csvResponse(`customers-export-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  }

  return jsonResponse(400, { error: "Export not supported for this resource." });
}
