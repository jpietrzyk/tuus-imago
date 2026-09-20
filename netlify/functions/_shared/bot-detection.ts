import {
  HONEYPOT_FIELDS,
  type HoneypotField,
} from "../../../src/lib/honeypot-fields";
import { captureServerMessage } from "./sentry";

export { HONEYPOT_FIELDS };
export type { HoneypotField };

/**
 * Returns the first honeypot field that looks filled, or null when all are
 * absent/blank. A non-string, non-null value in a field that should never be
 * submitted is treated as suspicious too.
 */
export function filledHoneypotField(
  payload: Record<string, unknown>,
): HoneypotField | null {
  for (const field of HONEYPOT_FIELDS) {
    const value = payload[field];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      if (value.trim().length > 0) return field;
      continue;
    }
    return field;
  }
  return null;
}

/**
 * Records a bot-detection hit for watching. Best-effort: always logs, and
 * reports to Sentry when monitoring is configured.
 */
export function trackBotDetection(scope: string, field: HoneypotField): void {
  const message = `[bot-detection] ${scope}: honeypot field "${field}" was filled`;
  console.warn(message);
  void captureServerMessage(message, {
    function: scope,
    botDetection: true,
    honeypotField: field,
  });
}
