import { describe, it, expect, beforeEach } from "vitest";
import {
  POST_AUTH_REDIRECT_KEY,
  setPostAuthRedirect,
  consumePostAuthRedirect,
  clearPostAuthRedirect,
  hasAuthResponseInUrl,
} from "./post-auth-redirect";

describe("post-auth redirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and consumes a path", () => {
    setPostAuthRedirect("/prepare-painting");
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe(
      "/prepare-painting",
    );
    expect(consumePostAuthRedirect()).toBe("/prepare-painting");
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(consumePostAuthRedirect()).toBeNull();
  });

  it("ignores legacy boolean values", () => {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, "true");
    expect(consumePostAuthRedirect()).toBeNull();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("rejects protocol-relative paths", () => {
    setPostAuthRedirect("//evil.com");
    expect(consumePostAuthRedirect()).toBeNull();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("rejects backslash paths", () => {
    setPostAuthRedirect("/\\evil.com");
    expect(consumePostAuthRedirect()).toBeNull();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("rejects absolute external URLs", () => {
    setPostAuthRedirect("https://evil.com/steal");
    expect(consumePostAuthRedirect()).toBeNull();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });

  it("clears a stored path", () => {
    setPostAuthRedirect("/checkout");
    clearPostAuthRedirect();
    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBeNull();
  });
});

describe("hasAuthResponseInUrl", () => {
  it("detects implicit OAuth tokens in the hash", () => {
    expect(
      hasAuthResponseInUrl(
        "https://tuusimago.com/#access_token=abc&token_type=bearer",
      ),
    ).toBe(true);
  });

  it("does not treat an OAuth error return as a redirect trigger", () => {
    expect(
      hasAuthResponseInUrl(
        "https://tuusimago.com/#error_description=Something+failed",
      ),
    ).toBe(false);
  });

  it("does not treat a password-recovery return as a redirect trigger", () => {
    expect(
      hasAuthResponseInUrl(
        "https://tuusimago.com/auth/update-password#access_token=abc&type=recovery",
      ),
    ).toBe(false);
  });

  it("ignores a normal page URL", () => {
    expect(hasAuthResponseInUrl("https://tuusimago.com/prepare-painting")).toBe(
      false,
    );
  });

  it("ignores a coupon code query parameter", () => {
    expect(hasAuthResponseInUrl("https://tuusimago.com/?code=SUMMER")).toBe(
      false,
    );
  });
});
