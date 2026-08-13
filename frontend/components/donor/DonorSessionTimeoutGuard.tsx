"use client";

import { useInactivityTimer } from "@/lib/sessionTimeout";
import { SessionTimeoutWarning } from "@/components/admin/SessionTimeoutWarning";

/**
 * Donor-side equivalent of components/admin/SessionTimeoutGuard.tsx.
 * Same 30-minute inactivity timer and 25-minute warning toast, reused
 * as-is since useInactivityTimer has nothing admin-specific in it.
 */
export function DonorSessionTimeoutGuard({ children }: { children: React.ReactNode }) {
  const { showWarning } = useInactivityTimer();
  return (
    <>
      {children}
      {showWarning && <SessionTimeoutWarning />}
    </>
  );
}
