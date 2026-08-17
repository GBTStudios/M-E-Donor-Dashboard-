"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, XCircle } from "lucide-react";
import {
  getMyDonorSettings,
  updateDonorNotificationPreferences,
  isDonorSettingsError,
} from "@/lib/donorSettings";

const ACCESS_TOKEN_KEY = "access_token";

function ToggleRow({
  label, description, checked, onChange,
}: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
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
  const { t } = useTranslation("donor");
  const [quarterlyReportReady, setQuarterlyReportReady] = useState(true);
  const [newCohortMilestones, setNewCohortMilestones] = useState(true);
  const [answerCorrections, setAnswerCorrections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setError(t("errors.sessionExpiredGeneric"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(
    field: "quarterlyReportReady" | "newCohortMilestones" | "answerCorrections",
    value: boolean
  ) {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError(t("errors.sessionExpiredGeneric"));
      return;
    }

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
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">{t("settings.notifications.title")}</h2>
      <p className="text-sm text-[#5B7571] mb-2">{t("settings.notifications.description")}</p>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 my-3">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="divide-y divide-black/5">
        <ToggleRow
          label={t("settings.notifications.quarterlyReportReady.label")}
          description={t("settings.notifications.quarterlyReportReady.description")}
          checked={quarterlyReportReady}
          onChange={(v) => handleToggle("quarterlyReportReady", v)}
        />
        <ToggleRow
          label={t("settings.notifications.newCohortMilestones.label")}
          description={t("settings.notifications.newCohortMilestones.description")}
          checked={newCohortMilestones}
          onChange={(v) => handleToggle("newCohortMilestones", v)}
        />
        <ToggleRow
          label={t("settings.notifications.answerCorrections.label")}
          description={t("settings.notifications.answerCorrections.description")}
          checked={answerCorrections}
          onChange={(v) => handleToggle("answerCorrections", v)}
        />
      </div>
    </div>
  );
}