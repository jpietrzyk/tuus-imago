import { describe, expect, it } from "vitest";
import {
  generateOrderAccessToken,
  verifyOrderAccess,
} from "../functions/_shared/order-access";

describe("order-access", () => {
  it("generates distinct, non-empty tokens", () => {
    const first = generateOrderAccessToken();
    const second = generateOrderAccessToken();

    expect(first).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it("accepts a matching token", () => {
    const token = generateOrderAccessToken();
    expect(verifyOrderAccess(token, token)).toBe(true);
  });

  it("rejects a missing or mismatched token", () => {
    const token = generateOrderAccessToken();
    expect(verifyOrderAccess(token, undefined)).toBe(false);
    expect(verifyOrderAccess(token, null)).toBe(false);
    expect(verifyOrderAccess(token, `${token}x`)).toBe(false);
    expect(verifyOrderAccess(token, "some-other-token")).toBe(false);
  });

  it("keeps the legacy UUID-only behavior for orders without a token", () => {
    expect(verifyOrderAccess(null, undefined)).toBe(true);
    expect(verifyOrderAccess(undefined, undefined)).toBe(true);
  });
});
