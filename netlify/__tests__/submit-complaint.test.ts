import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "test-cloud");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("omits the photos column when no attachments are sent", async () => {
    const { insert } = setupSupabaseMock();

    const response = await post(VALID_PAYLOAD);

    expect(response.statusCode).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.not.objectContaining({ photos: expect.anything() }),
    );
  });

  it("stores validated Cloudinary photo attachments", async () => {
    const { insert } = setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      photos: [
        {
          url: "https://res.cloudinary.com/test-cloud/image/upload/v1/complaints/a.jpg",
          public_id: "tuus-imago/complaints/a",
        },
      ],
    });

    expect(response.statusCode).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: [
          {
            url: "https://res.cloudinary.com/test-cloud/image/upload/v1/complaints/a.jpg",
            public_id: "tuus-imago/complaints/a",
          },
        ],
      }),
    );
  });

  it("rejects photo attachments from an untrusted host", async () => {
    setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      photos: [
        { url: "https://evil.example/tracker.gif", public_id: "x" },
      ],
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects Cloudinary URLs from a different cloud", async () => {
    setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      photos: [
        {
          url: "https://res.cloudinary.com/other-cloud/image/upload/v1/a.jpg",
          public_id: "a",
        },
      ],
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects lookalike URLs that merely contain the configured cloud path", async () => {
    setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      photos: [
        {
          url: "https://res.cloudinary.com/evil/image/upload/res.cloudinary.com/test-cloud/a.jpg",
          public_id: "a",
        },
      ],
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects photos when the cloud name is not configured", async () => {
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "");
    setupSupabaseMock();

    const response = await post({
      ...VALID_PAYLOAD,
      photos: [
        {
          url: "https://res.cloudinary.com/test-cloud/image/upload/v1/a.jpg",
          public_id: "a",
        },
      ],
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects more than five photo attachments", async () => {
    setupSupabaseMock();

    const photo = {
      url: "https://res.cloudinary.com/test-cloud/image/upload/v1/a.jpg",
      public_id: "a",
    };

    const response = await post({
      ...VALID_PAYLOAD,
      photos: Array.from({ length: 6 }, () => ({ ...photo })),
    });

    expect(response.statusCode).toBe(400);
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
