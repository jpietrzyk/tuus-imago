import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getReferralCookie } from "./referral-cookie";
import { HONEYPOT_FIELD_A, HONEYPOT_FIELD_B } from "./honeypot-fields";

export function useReferralTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const ref = getReferralCookie();
    if (!ref) return;

    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    fetch("/.netlify/functions/track-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Honeypot fields: the real client always leaves them empty, so a filled
      // value marks an automated submission server-side.
      body: JSON.stringify({
        ref_code: ref,
        path: location.pathname,
        [HONEYPOT_FIELD_A]: "",
        [HONEYPOT_FIELD_B]: "",
      }),
    }).catch(() => {});
  }, [location.pathname]);
}
