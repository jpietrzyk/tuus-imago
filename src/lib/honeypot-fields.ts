/**
 * Honeypot field names shared by the client forms and the Netlify functions.
 *
 * The names are intentionally opaque: browser and password-manager autofill
 * matches semantic names (e.g. "website", "company") and would fill a hidden
 * input for a real user, while automated bots still populate every field on a
 * form and trip the trap.
 */
export const HONEYPOT_FIELD_A = "tuus_imago_field_a";
export const HONEYPOT_FIELD_B = "tuus_imago_field_b";

export const HONEYPOT_FIELDS = [HONEYPOT_FIELD_A, HONEYPOT_FIELD_B] as const;

export type HoneypotField = (typeof HONEYPOT_FIELDS)[number];
