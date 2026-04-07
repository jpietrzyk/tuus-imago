import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/delete-account";
import { readBody } from "./test-utils/supabase-mocks";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

describe("delete-account handler", () => {
  const profileUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const profileUpdate = vi.fn().mockReturnValue({ eq: profileUpdateEq });
  const addressDeleteEq = vi.fn().mockResolvedValue({ error: null });
  const addressDelete = vi.fn().mockReturnValue({ eq: addressDeleteEq });
  const orderUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const orderUpdate = vi.fn().mockReturnValue({ eq: orderUpdateEq });
  const deleteUser = vi.fn().mockResolvedValue({ error: null });

  const serviceFrom = vi.fn((table: string) => {
    switch (table) {
      case "profiles": return { update: profileUpdate };
      case "addresses": return { delete: addressDelete };
      case "orders": return { update: orderUpdate };
      default: throw new Error(`Unexpected table: ${table}`);
    }
  });

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "pk_test";
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  });

  it("returns 401 when no authorization header", async () => {
    const response = await handler({ httpMethod: "POST", body: null });
    expect(response.statusCode).toBe(401);
  });

  it("returns 405 for GET requests", async () => {
    const response = await handler({
      httpMethod: "GET",
      headers: { authorization: "Bearer token-123" },
    });
    expect(response.statusCode).toBe(405);
  });

  it("anonymizes profile, deletes addresses, anonymizes orders, and deletes auth user", async () => {
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "jane@example.com" } },
          error: null,
        }),
      },
    };
    const serviceClient = { from: serviceFrom };
    const adminClient = {
      auth: { admin: { deleteUser } },
    };

    createClientMock
      .mockReturnValueOnce(authClient as never)
      .mockReturnValueOnce(serviceClient as never)
      .mockReturnValueOnce(adminClient as never);

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer token-123" },
    });

    expect(response.statusCode).toBe(200);
    expect(readBody<{ status: string }>(response)).toEqual({ status: "deleted" });

    expect(profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Deleted User",
        phone: null,
        deleted_at: expect.any(String),
      }),
    );
    expect(addressDelete).toHaveBeenCalled();
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: "Deleted User",
        customer_phone: null,
        user_id: null,
      }),
    );
    expect(deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("returns 500 when profile anonymization fails", async () => {
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "jane@example.com" } },
          error: null,
        }),
      },
    };

    const failingUpdateEq = vi.fn().mockResolvedValue({ error: { message: "DB error" } });
    const failingFrom = vi.fn(() => ({
      update: vi.fn().mockReturnValue({ eq: failingUpdateEq }),
    }));

    createClientMock
      .mockReturnValueOnce(authClient as never)
      .mockReturnValueOnce({ from: failingFrom } as never);

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer token-123" },
    });

    expect(response.statusCode).toBe(500);
    expect(readBody<{ error: string }>(response)).toEqual({
      error: "Could not delete account.",
    });
  });
});
