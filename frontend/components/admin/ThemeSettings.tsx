"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle, Sun, Moon, Monitor } from "lucide-react";
import { getMySettings, updateTheme, isSettingsError, type Theme } from "@/lib/userSettings";

const ACCESS_TOKEN_KEY = "access_token";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "system", label: "System Default", icon: Monitor },
];

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setError("Your session has expired. Please log in again.");
        setIsLoading(false);
        return;
      }
      const result = await getMySettings(accessToken);
      setIsLoading(false);
      if (isSettingsError(result)) {
        setError(result.message);
        return;
      }
      setTheme(result.settings.theme);
    }
    load();
  }, []);

  async function handleSelect(next: Theme) {
    if (next === theme || isSaving) return;
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    const previous = theme;
    setTheme(next); // optimistic
    setIsSaving(true);
    const result = await updateTheme(accessToken, next);
    setIsSaving(false);

    if (isSettingsError(result)) {
      setTheme(previous);
      setError(result.message);
      return;
    }
    setTheme(result.settings.theme);
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
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">Appearance</h2>
      <p className="text-sm text-[#5B7571] mb-4">Choose how the dashboard looks for you.</p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            disabled={isSaving}
            aria-pressed={theme === value}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60 ${
              theme === value
                ? "border-[#1A534A] bg-white/70 ring-2 ring-[#1A534A]/30"
                : "border-black/10 bg-white/40 hover:bg-white/60"
            }`}
          >
            <Icon className={`w-5 h-5 ${theme === value ? "text-[#1A534A]" : "text-[#7C9791]"}`} />
            <span
              className={`text-xs font-semibold text-center ${
                theme === value ? "text-[#1A534A]" : "text-[#5B7571]"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
