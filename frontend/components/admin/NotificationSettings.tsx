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
        <p className="text-sm font-semibold text-[#2C3E38]">{label}</p>
        <p className="text-xs text-[#7C9791] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-150 ${
          checked ? "bg-[#1A534A]" : "bg-black/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? "translate-x-4" : "translate-x-0"
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

  // Instant optimistic flip — the toggle stays fully interactive at all
  // times, never disabled or dimmed while a save is in flight, so it always
  // feels immediate regardless of network speed. Only reverts (and shows an
  // error) if the save actually fails. If a second click comes in before the
  // first request resolves, whichever request finishes last simply wins —
  // fine for a plain boolean preference like this.
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

    const setters = {
      emailAlerts: setEmailAlerts,
      inAppAlerts: setInAppAlerts,
      securityAlerts: setSecurityAlerts,
    };
    setters[field](value);

    const result = await updateNotificationPreferences(accessToken, { [field]: value });

    if (isSettingsError(result)) {
      setters[field](!value);
      setError(result.message);
      return;
    }
    setEmailAlerts(result.settings.emailAlerts);
    setInAppAlerts(result.settings.inAppAlerts);
    setSecurityAlerts(result.settings.securityAlerts);
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
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">System Notifications</h2>
      <p className="text-sm text-[#5B7571] mb-2">Choose what you want to be notified about.</p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 my-3"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="divide-y divide-black/5">
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
