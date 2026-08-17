"use client";
/**
 * i18next setup, initialized globally (see components/I18nInit.tsx, wired
 * into app/layout.tsx) so shared components work correctly on every route
 * — admin included — even though only donor settings currently exposes a
 * language switcher.
 *
 * IMPORTANT: initial `lng` is hardcoded to "en", NOT read from localStorage
 * here. Reading localStorage at module-init time causes a server/client
 * hydration mismatch — SSR always sees no localStorage (renders "en"),
 * but the client's first pass would read a stored "de" and render German
 * before hydration even completes, so React sees mismatched markup.
 * The stored locale is instead applied post-mount, in a useEffect
 * (components/I18nInit.tsx), which is guaranteed to run only after
 * hydration has already committed matching server/client output.
 *
 * Language choice is persisted two ways:
 *  - locally in localStorage, so the UI stays in the chosen language on
 *    reload before the settings API call resolves
 *  - remotely via PUT /settings/me/regional (lib/donorSettings.ts), the
 *    source of truth if the donor logs in from another device
 *
 * Only English strings are filled in right now. German files exist with
 * the same keys but every value is an English placeholder — swap in real
 * translations in public/locales/de/*.json when available. Nothing else
 * needs to change when you do.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/public/locales/en/common.json";
import enDonor from "@/public/locales/en/donor.json";
import deCommon from "@/public/locales/de/common.json";
import deDonor from "@/public/locales/de/donor.json";

const LANGUAGE_STORAGE_KEY = "donor_language";

export const SUPPORTED_LANGUAGES = ["English", "German"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_TO_LOCALE: Record<SupportedLanguage, string> = {
  English: "en",
  German: "de",
};

const LOCALE_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  en: "English",
  de: "German",
};

export function languageToLocale(language: string): string {
  return LANGUAGE_TO_LOCALE[language as SupportedLanguage] ?? "en";
}

export function localeToLanguage(locale: string): SupportedLanguage {
  return LOCALE_TO_LANGUAGE[locale] ?? "English";
}

// Exported so I18nInit.tsx can read it post-mount (client-only, safe) to
// sync i18next to whatever locale the donor previously chose.
export function getStoredLocale(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "en";
}

export function storeLocale(locale: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon, donor: enDonor },
      de: { common: deCommon, donor: deDonor },
    },
    lng: "en", // always start in English — see note above; real locale is applied post-mount
    fallbackLng: "en",
    ns: ["common", "donor"],
    defaultNS: "donor",
    interpolation: { escapeValue: false }, // React already escapes
  });
}

export default i18n;