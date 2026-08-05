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
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-[#1A534A]" : "bg-black/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
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
  const [pendingField, setPendingField] = useState<string | null>(null);
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

    // Optimistic update — flip immediately, revert if the request fails.
    const setters = {
      emailAlerts: setEmailAlerts,
      inAppAlerts: setInAppAlerts,
      securityAlerts: setSecurityAlerts,
    };
    setters[field](value);
    setPendingField(field);

    const result = await updateNotificationPreferences(accessToken, { [field]: value });
    setPendingField(null);

    if (isSettingsError(result)) {
      setters[field](!value); // revert on failure
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
          disabled={pendingField === "emailAlerts"}
          onChange={(v) => handleToggle("emailAlerts", v)}
        />
        <ToggleRow
          label="In-App Alerts"
          description="Show notifications within the dashboard."
          checked={inAppAlerts}
          disabled={pendingField === "inAppAlerts"}
          onChange={(v) => handleToggle("inAppAlerts", v)}
        />
        <ToggleRow
          label="Security Alerts"
          description="Be notified about sign-ins and account security events."
          checked={securityAlerts}
          disabled={pendingField === "securityAlerts"}
          onChange={(v) => handleToggle("securityAlerts", v)}
        />
      </div>
    </div>
  );
}
