"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSuperadmin } from "@/lib/adminAuth";

/**
 * Wrap any page that only a superadmin should see (e.g. User Management).
 * This is a UI convenience only — the real enforcement is server-side per
 * the contract (403 on protected endpoints for non-superadmins). Don't
 * treat this as a security boundary on its own.
 */
export function RequireSuperadmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSuperadmin()) {
      router.replace("/admin-dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
