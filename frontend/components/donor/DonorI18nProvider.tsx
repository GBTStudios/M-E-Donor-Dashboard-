"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

/**
 * Wraps donor pages. Now mostly redundant with the global init in
 * components/I18nInit.tsx (see app/layout.tsx), but harmless to keep —
 * I18nextProvider just re-provides the same already-initialized i18n
 * instance via context.
 */
export function DonorI18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
