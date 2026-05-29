import { getAuthHeaders } from "@/admin/lib/get-auth-headers";

type AdminFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export class AdminApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AdminApiError";
    this.statusCode = statusCode;
  }
}

export async function adminFetch<T = unknown>(
  path: string,
  options: AdminFetchOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const headers = await getAuthHeaders();

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = "Request failed.";
    try {
      const errorData = (await response.json()) as { error?: string };
      errorMessage = errorData.error ?? errorMessage;
    } catch {
      // response body was not JSON, use default message
    }
    throw new AdminApiError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}
