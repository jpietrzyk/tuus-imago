import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { handler } from "../functions/trigger-build";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const ORIGINAL_FETCH = globalThis.fetch;

function mockFetchForAuth(user: { id: string; email: string }) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
    (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/auth/v1/user")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(user),
          text: () => Promise.resolve(JSON.stringify(user)),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    },
  );
}

function readBody(response: { body: string }) {
  return JSON.parse(response.body);
}

function setupProfileClient(isAdmin: boolean) {
  const single = vi.fn().mockResolvedValue({
    data: { is_admin: isAdmin },
    error: null,
  });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn(() => ({ select }));
  const client = { from };
  createClientMock.mockReturnValue(client as never);
  return client;
}

describe("trigger-build handler", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    process.env.NETLIFY_BUILD_HOOK_URL = "https://api.netlify.com/build_hooks/test-hook";
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.NETLIFY_BUILD_HOOK_URL;
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("rejects non-POST methods", async () => {
    const response = await handler({ httpMethod: "GET", headers: {} });
    expect(response.statusCode).toBe(405);
  });

  it("returns 401 when no authorization header", async () => {
    const response = await handler({ httpMethod: "POST", headers: {} });
    expect(response.statusCode).toBe(401);
    expect(readBody(response).error).toContain("Missing authorization token");
  });

  it("returns 403 when user is not an admin", async () => {
    mockFetchForAuth({ id: "user-1", email: "user@test.com" });
    setupProfileClient(false);

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 500 when build hook is not configured", async () => {
    delete process.env.NETLIFY_BUILD_HOOK_URL;
    mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
    setupProfileClient(true);

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(500);
    expect(readBody(response).error).toContain("not configured");
  });

  it("posts to the build hook and returns ok for an admin", async () => {
    mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
    setupProfileClient(true);

    const buildHookFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    // Second global fetch call (first was the auth check) targets the build hook.
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      buildHookFetch,
    );

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(readBody(response)).toEqual({ ok: true });
    expect(buildHookFetch).toHaveBeenCalledWith(
      "https://api.netlify.com/build_hooks/test-hook",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns 502 when the build hook responds with an error", async () => {
    mockFetchForAuth({ id: "admin-1", email: "admin@test.com" });
    setupProfileClient(true);

    const buildHookFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve("rate limited"),
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      buildHookFetch,
    );

    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(502);
    expect(readBody(response).error).toContain("429");
  });
});
