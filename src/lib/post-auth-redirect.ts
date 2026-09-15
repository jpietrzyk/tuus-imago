/**
 * sessionStorage key used to remember the path an OAuth/magic-link login was
 * started from (e.g. `/checkout`, `/prepare-painting`) so the user is returned
 * to the same place after the provider redirect.
 */
export const POST_AUTH_REDIRECT_KEY = "post-auth-redirect";

export function setPostAuthRedirect(path: string): void {
  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {
    // sessionStorage may be unavailable (private browsing, quota).
  }
}

/**
 * Reads and clears the stored post-auth redirect path. Returns null when no
 * (valid) path is stored, including a legacy boolean-style value.
 */
export function consumePostAuthRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (!path) return null;
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return isSafeRedirectPath(path) ? path : null;
  } catch {
    return null;
  }
}

/**
 * Resolved path of the OAuth/magic-link callback route. Shared so the redirect
 * owner and the router definition cannot drift apart.
 */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/**
 * Detects a successful implicit-flow OAuth response in a URL (tokens in the
 * hash). Used to scope the global post-auth redirect to provider returns only,
 * so an ordinary email/password sign-in can never be hijacked by a stale path.
 *
 * Error returns (`error_description`) and password-recovery returns
 * (`type=recovery`) are intentionally excluded: the former must not latch the
 * flag, and the latter is handled by the update-password page rather than
 * redirected away.
 */
const IMPLICIT_OAUTH_RESPONSE_RE = /[#&]access_token=/;
const RECOVERY_RESPONSE_RE = /[#&]type=recovery/;

export function hasAuthResponseInUrl(url: string): boolean {
  return (
    IMPLICIT_OAUTH_RESPONSE_RE.test(url) && !RECOVERY_RESPONSE_RE.test(url)
  );
}

/**
 * Only same-origin absolute paths are allowed. Rejects protocol-relative
 * (`//evil.com`) and backslash (`/\evil.com`) values, which browsers would
 * otherwise resolve to an external origin.
 */
function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return false;
  }
  try {
    return (
      new URL(path, window.location.origin).origin === window.location.origin
    );
  } catch {
    return false;
  }
}

export function clearPostAuthRedirect(): void {
  try {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    // sessionStorage may be unavailable.
  }
}
