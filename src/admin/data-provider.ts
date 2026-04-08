import type { DataProvider, HttpError, BaseRecord } from "@refinedev/core";
import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

function mapOperator(operator: string): string {
  const operatorMap: Record<string, string> = {
    eq: "eq",
    ne: "ne",
    lt: "lt",
    gt: "gt",
    lte: "lte",
    gte: "gte",
    in: "in",
    contains: "contains",
    startswith: "startswith",
    endswith: "endswith",
    null: "null",
    nnull: "nnull",
  };
  return operatorMap[operator] ?? "eq";
}

const API_URL = "/.netlify/functions/admin-api";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const adminDataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters, meta }): Promise<any> => {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({ resource });
    const currentPage = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 25;
    params.set("pagination", JSON.stringify({ current: currentPage, pageSize }));

    if (sorters && sorters.length > 0) {
      params.set(
        "sorters",
        JSON.stringify(
          sorters.map((s) => ({ field: s.field, order: s.order })),
        ),
      );
    }

    if (filters && filters.length > 0) {
      const mappedFilters = filters.map((f) => {
        if ("field" in f) {
          return {
            field: f.field,
            operator: mapOperator(f.operator),
            value: f.value,
          };
        }
        return null;
      }).filter(Boolean);

      if (mappedFilters.length > 0) {
        params.set("filters", JSON.stringify(mappedFilters));
      }
    }

    if (meta?.select) {
      params.set("select", meta.select as string);
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to fetch list.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as {
      data: BaseRecord[];
      total: number;
    };

    return {
      data: result.data,
      total: result.total,
    };
  },

  getOne: async ({ resource, id, meta }): Promise<any> => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ resource, id: String(id) });
    if (meta?.select) {
      params.set("select", meta.select as string);
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to fetch record.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as { data: BaseRecord };
    return { data: result.data };
  },

  getMany: async ({ resource, ids, meta }): Promise<any> => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ resource });
    if (meta?.select) {
      params.set("select", meta.select as string);
    }

    params.set(
      "filters",
      JSON.stringify([{ field: "id", operator: "in", value: ids }]),
    );

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to fetch records.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as { data: BaseRecord[] };
    return { data: result.data };
  },

  create: async ({ resource, variables, meta }): Promise<any> => {
    const headers = await getAuthHeaders();
    const body: Record<string, unknown> = {
      resource,
      data: variables,
    };
    if (meta) {
      body.meta = meta;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to create record.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as { data: BaseRecord };
    return { data: result.data };
  },

  update: async ({ resource, id, variables, meta }): Promise<any> => {
    const headers = await getAuthHeaders();
    const body: Record<string, unknown> = {
      resource,
      id: String(id),
      data: variables,
    };
    if (meta) {
      body.meta = meta;
    }

    const response = await fetch(API_URL, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to update record.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as { data: BaseRecord };
    return { data: result.data };
  },

  deleteOne: async ({ resource, id }): Promise<any> => {
    const headers = await getAuthHeaders();

    const response = await fetch(API_URL, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ resource, id: String(id) }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Failed to delete record.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as { data: BaseRecord };
    return { data: result.data };
  },

  custom: async ({ url, method, payload, query, headers: customHeaders }): Promise<any> => {
    const headers = {
      ...(await getAuthHeaders()),
      ...customHeaders,
    };

    let requestUrl = url ?? API_URL;

    if (query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }
      requestUrl += `?${searchParams.toString()}`;
    }

    const response = await fetch(requestUrl, {
      method: method ?? "GET",
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      throw {
        message: error.error ?? "Request failed.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = await response.json();
    return { data: result };
  },

  getApiUrl: () => API_URL,
};
