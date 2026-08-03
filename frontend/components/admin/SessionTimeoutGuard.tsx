"use client";

import { useInactivityTimer } from "@/lib/sessionTimeout";
import { SessionTimeoutWarning } from "@/components/admin/SessionTimeoutWarning";

/**
 * Wrap any admin-only page's content with this to enable the 30-minute
 * inactivity timeout — mounts the tracker and renders the 25-minute
 * warning toast when active. Compose alongside RequireFirstLoginComplete /
 * RequireSuperadmin (order doesn't matter relative to those — this only
 * adds the timer, it doesn't gate access on its own).
 */
export function SessionTimeoutGuard({ children }: { children: React.ReactNode }) {
  const { showWarning } = useInactivityTimer();

  return (
    <>
      {children}
      {showWarning && <SessionTimeoutWarning />}
    </>
  );
}
