"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle, Sun, Moon, Monitor } from "lucide-react";
import { getMySettings, updateTheme, isSettingsError, type Theme } from "@/lib/userSettings";
import { applyTheme, storeTheme } from "@/lib/theme";

const ACCESS_TOKEN_KEY = "access_token";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark Mode", icon: Moon },
  { value: "system", label: "System Default", icon: Monitor },
];

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isLoading, setIsLoading] = useState(true);
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
      // Apply whatever the server says the theme is on load
      applyTheme(result.settings.theme);
      storeTheme(result.settings.theme);
    }
    load();
  }, []);

  async function handleSelect(next: Theme) {
    if (next === theme) return;
    setError(undefined);

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    // Optimistic: apply immediately so the user sees the change at once
    const previous = theme;
    setTheme(next);
    applyTheme(next);
    storeTheme(next);

    const result = await updateTheme(accessToken, next);

    if (isSettingsError(result)) {
      // Revert on failure
      setTheme(previous);
      applyTheme(previous);
      storeTheme(previous);
      setError(result.message);
      return;
    }

    // Confirm with what the server actually saved
    const confirmed = result.settings.theme;
    setTheme(confirmed);
    applyTheme(confirmed);
    storeTheme(confirmed);
  }

  if (isLoading) {
    return (
      <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-sm flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C9791] dark:text-[#5a9e94]" />
      </div>
    );
  }

  return (
    <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1A534A] dark:text-[#7dd3c0] mb-1">Appearance</h2>
      <p className="text-sm text-[#5B7571] dark:text-[#8fada9] mb-4">
        Choose how the dashboard looks for you.
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3 mb-4"
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
            aria-pressed={theme === value}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
              theme === value
                ? "border-[#1A534A] dark:border-[#7dd3c0] bg-white/70 dark:bg-white/10 ring-2 ring-[#1A534A]/30 dark:ring-[#7dd3c0]/30"
                : "border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                theme === value ? "text-[#1A534A] dark:text-[#7dd3c0]" : "text-[#7C9791] dark:text-[#5a9e94]"
              }`}
            />
            <span
              className={`text-xs font-semibold text-center ${
                theme === value ? "text-[#1A534A] dark:text-[#7dd3c0]" : "text-[#5B7571] dark:text-[#8fada9]"
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
