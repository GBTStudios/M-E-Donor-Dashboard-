"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, XCircle, Info } from "lucide-react";
import {
  getMyDonorSettings,
  getSettingsOptions,
  updateDonorRegionalPreferences,
  isDonorSettingsError,
  isSettingsOptionsError,
} from "@/lib/donorSettings";
import i18n, { languageToLocale, storeLocale } from "@/lib/i18n";

const ACCESS_TOKEN_KEY = "access_token";

const TIMEZONES = [
  { value: "Africa/Kampala", label: "Africa/Kampala (EAT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "America/New_York", label: "America/New York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PT)" },
  { value: "UTC", label: "UTC" },
];

export function DonorRegionalPreferences() {
  const { t } = useTranslation("donor");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("");
  const [languageOptions, setLanguageOptions] = useState<string[]>(["English"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setError(t("errors.sessionExpiredGeneric"));
        setIsLoading(false);
        return;
      }

      const [settingsResult, optionsResult] = await Promise.all([
        getMyDonorSettings(accessToken),
        getSettingsOptions(),
      ]);
      setIsLoading(false);

      if (isDonorSettingsError(settingsResult)) {
        setError(settingsResult.message);
      } else {
        setLanguage(settingsResult.settings.language);
        setTimezone(settingsResult.settings.timezone);

        const locale = languageToLocale(settingsResult.settings.language);
        if (i18n.language !== locale) {
          i18n.changeLanguage(locale);
          storeLocale(locale);
        }
      }

      if (!isSettingsOptionsError(optionsResult)) {
        setLanguageOptions(optionsResult.languages);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLanguageChange(next: string) {
    if (next === language) return;
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError(t("errors.sessionExpiredGeneric"));
      return;
    }
    const previous = language;
    setLanguage(next);
    setIsSaving(true);
    const result = await updateDonorRegionalPreferences(accessToken, { language: next });
    setIsSaving(false);
    if (isDonorSettingsError(result)) {
      setLanguage(previous);
      setError(result.message);
      return;
    }
    setLanguage(result.settings.language);
    setTimezone(result.settings.timezone);

    const locale = languageToLocale(result.settings.language);
    i18n.changeLanguage(locale);
    storeLocale(locale);
  }

  async function handleTimezoneChange(next: string) {
    if (next === timezone) return;
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError(t("errors.sessionExpiredGeneric"));
      return;
    }
    const previous = timezone;
    setTimezone(next);
    setIsSaving(true);
    const result = await updateDonorRegionalPreferences(accessToken, { timezone: next });
    setIsSaving(false);
    if (isDonorSettingsError(result)) {
      setTimezone(previous);
      setError(result.message);
      return;
    }
    setLanguage(result.settings.language);
    setTimezone(result.settings.timezone);
  }

  if (isLoading) {
    return (
      <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C9791]" />
      </div>
    );
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">{t("settings.regional.title")}</h2>
      <p className="text-sm text-[#5B7571] mb-4">
        {t("settings.regional.description")}
      </p>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="language" className="block text-xs font-bold text-[#1A534A] mb-1.5 uppercase tracking-wide">
            {t("settings.regional.language")}
          </label>
          <select
            id="language"
            value={language}
            disabled={isSaving}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full rounded-xl border border-[#1A534A]/40 bg-white px-3.5 py-2.5 text-sm text-[#1A534A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A534A]/30 focus:border-[#1A534A] disabled:opacity-60"
          >
            {languageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timezone" className="block text-xs font-bold text-[#1A534A] mb-1.5 uppercase tracking-wide">
            {t("settings.regional.timeZone")}
          </label>
          <select
            id="timezone"
            value={timezone}
            disabled={isSaving}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full rounded-xl border border-[#1A534A]/40 bg-white px-3.5 py-2.5 text-sm text-[#1A534A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A534A]/30 focus:border-[#1A534A] disabled:opacity-60"
          >
            {!TIMEZONES.some((tz) => tz.value === timezone) && timezone && (
              <option value={timezone}>{timezone}</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-[#7C9791] mt-4">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>{t("settings.regional.disclaimer")}</p>
      </div>
    </div>
  );
}