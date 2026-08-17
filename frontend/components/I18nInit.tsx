"use client";

import { useEffect } from "react";
import i18n, { getStoredLocale } from "@/lib/i18n";

/**
 * Mounted once at the root layout, wrapping every route. Two jobs:
 *
 * 1. Importing "@/lib/i18n" runs i18n.init() as a side effect, so
 *    useTranslation() works correctly everywhere — admin included.
 *
 * 2. The useEffect below applies the donor's previously-saved language
 *    preference AFTER hydration is already committed. This is the fix
 *    for a server/client mismatch: lib/i18n.ts always initializes with
 *    "en" (deterministic, matches SSR), and only this effect — which by
 *    definition only ever runs client-side, after mount — is allowed to
 *    read localStorage and switch languages. Doing the switch here
 *    instead of at module-init time means React always hydrates against
 *    matching English markup first, then re-renders to the stored
 *    language a moment later, same as any other ordinary post-mount
 *    state update. No hydration warning, no markup mismatch.
 */
export default function I18nInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== i18n.language) {
      i18n.changeLanguage(stored);
    }
  }, []);

  return <>{children}</>;
}