import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../functions/submit-complaint";
import { createServiceClient } from "../functions/_shared/supabase-auth";
import {
  HONEYPOT_FIELD_A,
  HONEYPOT_FIELD_B,
} from "../../src/lib/honeypot-fields";

vi.mock("../functions/_shared/supabase-auth", () => ({
  createServiceClient: vi.fn(),
}));

const mockCreateServiceClient = vi.mocked(createServiceClient);

const VALID_PAYLOAD = {
  name: "Jane Doe",
  email: "jane@example.com",
  orderNumber: "TI-2026-000001",
  complaintType: "damaged",
  description: "The frame arrived cracked.",
};

function setupSupabaseMock() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ insert }));
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

  mockCreateServiceClient.mockReturnValue({ from, rpc } as never);

  return { from, insert };
}

function post(body: unknown) {
  return handler({
    httpMethod: "POST",
    body: JSON.stringify(body),
  });
}

describe("submit-complaint handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST methods", async () => {
    const response = await handler({ httpMethod: "GET" });
    expect(response.statusCode).toBe(405);
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await handler({ httpMethod: "POST", body: "{" });
    expect(response.statusCode).toBe(400);
  });

  it("rejects missing required fields", async () => {
    const response = await post({ name: "Jane" });
    expect(response.statusCode).toBe(400);
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
  });

  it("rejects an invalid complaint type", async () => {
    const response = await post({ ...VALID_PAYLOAD, complaintType: "bogus" });
    expect(response.statusCode).toBe(400);
  });

  it("stores a valid complaint", async () => {
    const { insert } = setupSupabaseMock();

    const response = await post(VALID_PAYLOAD);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: null,
      address: null,
      order_number: "TI-2026-000001",
      order_date: null,
      product: null,
      complaint_type: "damaged",
      description: "The frame arrived cracked.",
      resolution: null,
    });
  });

  it("drops a honeypot submission with a fake success and no insert", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { insert } = setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      [HONEYPOT_FIELD_A]: "https://spam.example",
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
    expect(insert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("submit-complaint"),
    );

    warn.mockRestore();
  });

  it("flags a filled second honeypot field too", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { insert } = setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      [HONEYPOT_FIELD_B]: "ACME",
    });

    expect(response.statusCode).toBe(200);
    expect(insert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(HONEYPOT_FIELD_B),
    );

    warn.mockRestore();
  });
});
