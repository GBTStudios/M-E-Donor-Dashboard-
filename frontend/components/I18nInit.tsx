"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import i18n, { getStoredLocale } from "@/lib/i18n";

// Routes where the donor's language preference should apply. Everything
// else (admin included) always renders in English, regardless of what's
// stored — there's no language selector on the admin side, and shared
// components (ChangePasswordForm, ActiveSessionsList, etc.) must not
// silently switch language just because a donor set a preference earlier
// in the same browser.
const DONOR_ROUTE_PREFIXES = ["/donor", "/donor-dashboard"];

function isDonorRoute(pathname: string): boolean {
  return DONOR_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Mounted once at the root layout, wrapping every route. Three jobs:
 *
 * 1. Importing "@/lib/i18n" runs i18n.init() as a side effect, so
 *    useTranslation() works correctly everywhere.
 *
 * 2. On mount and on every route change, decides which language i18next
 *    should actually be showing: the donor's stored preference on donor
 *    routes, forced English everywhere else. This re-evaluates on every
 *    navigation (not just once) because i18n is a single global instance —
 *    without this, switching to German on a donor page and then
 *    navigating to an admin page would leave shared components (password
 *    forms, session lists) stuck in German with no way for an admin
 *    to change it back.
 *
 * 3. Runs only in a useEffect (client-only, post-mount) so the very first
 *    render always matches what the server rendered — avoiding the
 *    hydration mismatch that happens if locale is read/applied during
 *    module init instead.
 */
export default function I18nInit({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const desired = isDonorRoute(pathname ?? "") ? getStoredLocale() : "en";
    if (desired !== i18n.language) {
      i18n.changeLanguage(desired);
    }
  }, [pathname]);

  return <>{children}</>;
}