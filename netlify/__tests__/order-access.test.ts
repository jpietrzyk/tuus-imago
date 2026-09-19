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

  it("rejects a null token without legacy context", () => {
    expect(verifyOrderAccess(null, undefined)).toBe(false);
    expect(verifyOrderAccess(undefined, undefined)).toBe(false);
  });

  it("allows the legacy fallback for a recent unpaid order", () => {
    expect(
      verifyOrderAccess(null, undefined, {
        createdAt: new Date().toISOString(),
        paymentStatus: "pending",
      }),
    ).toBe(true);
  });

  it("rejects the legacy fallback outside the time window", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      verifyOrderAccess(null, null, {
        createdAt: eightDaysAgo,
        paymentStatus: "pending",
      }),
    ).toBe(false);
  });

  it("rejects the legacy fallback for a non-pending order", () => {
    expect(
      verifyOrderAccess(null, undefined, {
        createdAt: new Date().toISOString(),
        paymentStatus: "verified",
      }),
    ).toBe(false);
  });
});
