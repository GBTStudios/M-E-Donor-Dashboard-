"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirstLoginFlag } from "@/lib/adminAuth";

/**
 * Wrap any protected admin page (dashboard, admin tools, etc. — everything
 * EXCEPT the set-password page itself) with this component.
 *
 * Runs the first_login check on every mount, not just once after login —
 * this is what actually blocks direct URL entry (typing /admin-dashboard)
 * and back-button navigation, per the API contract's frontend rule. A
 * client-side redirect alone doesn't stop a determined technical user from
 * hitting backend endpoints directly, which is why the contract also
 * requires server-side 403 enforcement — this guard only covers the UI.
 */
export function RequireFirstLoginComplete({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getFirstLoginFlag()) {
      router.replace("/admin/set-password");
      return;
    }
    setChecked(true);
  }, [router]);

  // Render nothing until the check completes, so protected content never
  // flashes on screen even briefly before a redirect kicks in.
  if (!checked) return null;

  return <>{children}</>;
}
