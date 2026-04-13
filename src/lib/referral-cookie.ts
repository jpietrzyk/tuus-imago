const REF_COOKIE_NAME = "tuus_ref";
const REF_COOKIE_MAX_AGE_DAYS = 30;

export function setReferralCookie(code: string): void {
  if (!code.trim()) return;
  const maxAge = REF_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${REF_COOKIE_NAME}=${encodeURIComponent(code.trim())};max-age=${maxAge};path=/;SameSite=Lax`;
}

export function getReferralCookie(): string | null {
  const prefix = `${REF_COOKIE_NAME}=`;
  const found = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  if (!found) return null;
  return decodeURIComponent(found.slice(prefix.length));
}

export function removeReferralCookie(): void {
  document.cookie = `${REF_COOKIE_NAME}=;max-age=0;path=/;SameSite=Lax`;
}
