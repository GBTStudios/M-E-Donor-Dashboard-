"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import {
  getMySettings,
  updateNotificationPreferences,
  isSettingsError,
} from "@/lib/userSettings";

const ACCESS_TOKEN_KEY = "access_token";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0]">{label}</p>
        <p className="text-xs text-[#5B7571] dark:text-[#8fada9] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A534A] dark:focus-visible:ring-[#7dd3c0] ${
          checked
            ? "bg-[#1A534A] dark:bg-[#2a6b5e]"
            : "bg-gray-300 dark:bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
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
      setEmailAlerts(result.settings.emailAlerts);
      setInAppAlerts(result.settings.inAppAlerts);
      setSecurityAlerts(result.settings.securityAlerts);
    }
    load();
  }, []);

  async function handleToggle(
    field: "emailAlerts" | "inAppAlerts" | "securityAlerts",
    value: boolean
  ) {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    // Map each field to its own isolated setter — this is the key fix.
    // Previously the API response updated ALL three states at once, so a
    // slow first request finishing after a second click would overwrite the
    // second toggle's value. Now each toggle only ever touches its own state.
    const setters: Record<typeof field, (v: boolean) => void> = {
      emailAlerts: setEmailAlerts,
      inAppAlerts: setInAppAlerts,
      securityAlerts: setSecurityAlerts,
    };

    // Optimistic update — toggle immediately so UI feels instant
    setters[field](value);

    const result = await updateNotificationPreferences(accessToken, { [field]: value });

    if (isSettingsError(result)) {
      // Only revert the one field that failed
      setters[field](!value);
      setError(result.message);
      return;
    }

    // Only confirm the one field we saved — never touch the others
    const confirmed = result.settings[field];
    setters[field](confirmed);
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
      <h2 className="text-lg font-semibold text-[#1A534A] dark:text-[#7dd3c0] mb-1">System Notifications</h2>
      <p className="text-sm text-[#5B7571] dark:text-[#8fada9] mb-2">Choose what you want to be notified about.</p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3 my-3"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="divide-y divide-black/5 dark:divide-white/10">
        <ToggleRow
          label="Email Alerts"
          description="Receive account and activity notifications by email."
          checked={emailAlerts}
          onChange={(v) => handleToggle("emailAlerts", v)}
        />
        <ToggleRow
          label="In-App Alerts"
          description="Show notifications within the dashboard."
          checked={inAppAlerts}
          onChange={(v) => handleToggle("inAppAlerts", v)}
        />
        <ToggleRow
          label="Security Alerts"
          description="Be notified about sign-ins and account security events."
          checked={securityAlerts}
          onChange={(v) => handleToggle("securityAlerts", v)}
        />
      </div>
    </div>
  );
}
