import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/track-referral";
import { createServiceClient } from "../functions/_shared/supabase-auth";
import { HONEYPOT_FIELD_A } from "../../src/lib/honeypot-fields";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

function setupSupabaseMock() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data: { id: "ref-1" }, error: null });
  const eqSecond = vi.fn().mockReturnValue({ single });
  const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
  const select = vi.fn().mockReturnValue({ eq: eqFirst });
  const from = vi.fn((table: string) => {
    if (table === "partner_refs") return { select };
    if (table === "referral_events") return { insert };
    throw new Error(`Unexpected table: ${table}`);
  });
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

  mockCreateServiceClient.mockReturnValue({ from, rpc } as never);

  return { insert };
}

describe("track-referral handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST methods", async () => {
    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(405);
  });

  it("does not throw when path is not a string", async () => {
    const { insert } = setupSupabaseMock();

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ ref_code: "ABC123", path: 123 }),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true, tracked: true });
    expect(insert).toHaveBeenCalledWith({
      partner_ref_id: "ref-1",
      path: null,
      user_agent: null,
    });
  });

  it("bounds the stored path and user agent", async () => {
    const { insert } = setupSupabaseMock();

    const response = await handler({
      httpMethod: "POST",
      headers: { "user-agent": "x".repeat(600) },
      body: JSON.stringify({ ref_code: "ABC123", path: "p".repeat(600) }),
    });

    expect(response.statusCode).toBe(200);
    const payload = insert.mock.calls[0][0] as {
      path: string;
      user_agent: string;
    };
    expect(payload.path).toHaveLength(500);
    expect(payload.user_agent).toHaveLength(500);
  });

  it("drops a honeypot submission without inserting an event", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { insert } = setupSupabaseMock();

    const response = await handler({
      httpMethod: "POST",
      body: JSON.stringify({
        ref_code: "ABC123",
        [HONEYPOT_FIELD_A]: "spam",
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true, tracked: false });
    expect(insert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("track-referral"),
    );

    warn.mockRestore();
  });
});
