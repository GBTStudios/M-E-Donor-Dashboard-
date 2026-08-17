"use client";

import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import {
  getMyDonorSettings,
  updateDonorNotificationPreferences,
  isDonorSettingsError,
} from "@/lib/donorSettings";

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
        <p className="text-sm font-semibold text-[#1A534A]">{label}</p>
        <p className="text-xs text-[#5B7571] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A534A] ${
          checked ? "bg-[#1A534A]" : "bg-gray-300"
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

export function DonorNotificationSettings() {
  const [quarterlyReportReady, setQuarterlyReportReady] = useState(true);
  const [newCohortMilestones, setNewCohortMilestones] = useState(true);
  const [answerCorrections, setAnswerCorrections] = useState(false);
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
      const result = await getMyDonorSettings(accessToken);
      setIsLoading(false);
      if (isDonorSettingsError(result)) {
        setError(result.message);
        return;
      }
      setQuarterlyReportReady(result.settings.quarterlyReportReady);
      setNewCohortMilestones(result.settings.newCohortMilestones);
      setAnswerCorrections(result.settings.answerCorrections);
    }
    load();
  }, []);

  async function handleToggle(
    field: "quarterlyReportReady" | "newCohortMilestones" | "answerCorrections",
    value: boolean
  ) {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    // Isolated setter per field — same fix admin's NotificationSettings has,
    // so a slow first request can't clobber a fast second toggle.
    const setters: Record<typeof field, (v: boolean) => void> = {
      quarterlyReportReady: setQuarterlyReportReady,
      newCohortMilestones: setNewCohortMilestones,
      answerCorrections: setAnswerCorrections,
    };

    setters[field](value);

    const result = await updateDonorNotificationPreferences(accessToken, { [field]: value });

    if (isDonorSettingsError(result)) {
      setters[field](!value);
      setError(result.message);
      return;
    }

    setters[field](result.settings[field]);
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
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 my-3">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="divide-y divide-black/5">
        <ToggleRow
          label="Quarterly report ready"
          description="Get notified as soon as the latest impact and financial reports are available for review."
          checked={quarterlyReportReady}
          onChange={(v) => handleToggle("quarterlyReportReady", v)}
        />
        <ToggleRow
          label="New cohort milestones"
          description="Real-time alerts when active student cohorts reach significant educational or employment milestones."
          checked={newCohortMilestones}
          onChange={(v) => handleToggle("newCohortMilestones", v)}
        />
        <ToggleRow
          label="Answer corrections"
          description="Notify me when the assistant's answers are reviewed and corrected."
          checked={answerCorrections}
          onChange={(v) => handleToggle("answerCorrections", v)}
        />
      </div>
    </div>
  );
}