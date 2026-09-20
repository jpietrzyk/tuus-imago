import { afterEach, describe, expect, it, vi } from "vitest";
import {
  filledHoneypotField,
  trackBotDetection,
} from "../functions/_shared/bot-detection";
import {
  HONEYPOT_FIELD_A,
  HONEYPOT_FIELD_B,
  HONEYPOT_FIELDS,
} from "../../src/lib/honeypot-fields";

describe("honeypot detection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when honeypot fields are absent or blank", () => {
    expect(filledHoneypotField({})).toBeNull();
    expect(
      filledHoneypotField({ [HONEYPOT_FIELD_A]: "", [HONEYPOT_FIELD_B]: "   " }),
    ).toBeNull();
    expect(
      filledHoneypotField({ [HONEYPOT_FIELD_A]: null, [HONEYPOT_FIELD_B]: undefined }),
    ).toBeNull();
  });

  it("flags whichever honeypot field is filled", () => {
    expect(
      filledHoneypotField({ [HONEYPOT_FIELD_A]: "https://spam.example" }),
    ).toBe(HONEYPOT_FIELD_A);
    expect(filledHoneypotField({ [HONEYPOT_FIELD_B]: "ACME" })).toBe(
      HONEYPOT_FIELD_B,
    );
  });

  it("flags non-string values in a honeypot field", () => {
    expect(filledHoneypotField({ [HONEYPOT_FIELD_A]: 123 })).toBe(
      HONEYPOT_FIELD_A,
    );
  });

  it("exposes the shared honeypot field names", () => {
    expect(HONEYPOT_FIELDS).toContain(HONEYPOT_FIELD_A);
    expect(HONEYPOT_FIELDS).toContain(HONEYPOT_FIELD_B);
  });

  it("logs a warning with the scope and field when tracking a hit", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    trackBotDetection("submit-complaint", HONEYPOT_FIELD_A);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("submit-complaint"),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(HONEYPOT_FIELD_A));
  });
});
