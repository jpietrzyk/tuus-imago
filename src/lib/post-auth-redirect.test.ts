import { describe, it, expect, beforeEach } from "vitest";
import {
  POST_AUTH_REDIRECT_KEY,
  setPostAuthRedirect,
  consumePostAuthRedirect,
  clearPostAuthRedirect,
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
