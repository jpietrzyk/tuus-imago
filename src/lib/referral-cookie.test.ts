import { describe, it, expect, beforeEach } from "vitest";
import {
  setReferralCookie,
  getReferralCookie,
  removeReferralCookie,
} from "./referral-cookie";

describe("referral-cookie", () => {
  beforeEach(() => {
    document.cookie = "tuus_ref=;max-age=0;path=/";
  });

  describe("setReferralCookie", () => {
    it("sets the tuus_ref cookie with the given code", () => {
      setReferralCookie("PARTNER10");
      expect(getReferralCookie()).toBe("PARTNER10");
    });

    it("trims whitespace from the code", () => {
      setReferralCookie("  PARTNER10  ");
      expect(getReferralCookie()).toBe("PARTNER10");
    });

    it("does nothing when code is empty", () => {
      setReferralCookie("");
      expect(getReferralCookie()).toBeNull();
    });

    it("does nothing when code is only whitespace", () => {
      setReferralCookie("   ");
      expect(getReferralCookie()).toBeNull();
    });

    it("handles codes with special characters via encoding", () => {
      setReferralCookie("PARTNER%20CODE");
      expect(getReferralCookie()).toBe("PARTNER%20CODE");
    });

    it("overwrites a previous cookie value", () => {
      setReferralCookie("FIRST");
      setReferralCookie("SECOND");
      expect(getReferralCookie()).toBe("SECOND");
    });
  });

  describe("getReferralCookie", () => {
    it("returns null when no cookie is set", () => {
      expect(getReferralCookie()).toBeNull();
    });

    it("returns the cookie value when set", () => {
      setReferralCookie("MYCODE");
      expect(getReferralCookie()).toBe("MYCODE");
    });

    it("returns null after cookie is removed", () => {
      setReferralCookie("MYCODE");
      removeReferralCookie();
      expect(getReferralCookie()).toBeNull();
    });

    it("does not confuse with other cookies", () => {
      document.cookie = "other_cookie=value;path=/";
      expect(getReferralCookie()).toBeNull();
    });

    it("finds cookie among multiple cookies", () => {
      document.cookie = "first_cookie=abc;path=/";
      setReferralCookie("THE_REF");
      document.cookie = "last_cookie=xyz;path=/";
      expect(getReferralCookie()).toBe("THE_REF");
    });
  });

  describe("removeReferralCookie", () => {
    it("removes the cookie", () => {
      setReferralCookie("TOREMOVE");
      expect(getReferralCookie()).toBe("TOREMOVE");
      removeReferralCookie();
      expect(getReferralCookie()).toBeNull();
    });

    it("does not throw when no cookie exists", () => {
      expect(() => removeReferralCookie()).not.toThrow();
    });
  });
});
