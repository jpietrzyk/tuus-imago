import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getReferralCookie } from "./referral-cookie";

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
      body: JSON.stringify({ ref_code: ref, path: location.pathname }),
    }).catch(() => {});
  }, [location.pathname]);
}
