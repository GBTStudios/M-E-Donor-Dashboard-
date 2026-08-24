"use client";

import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { Cohort } from "@/lib/donorDashboard";

export default function CohortProgressList({ cohorts }: { cohorts: Cohort[] }) {
  const { t } = useTranslation("donor");

  if (cohorts.length === 0) {
    return (
      <div className="bg-[#eaf5f0] rounded-2xl p-6 text-center text-sm text-gray-500">
        {t("cohortProgress.empty")}
      </div>
    );
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-800">{t("cohortProgress.title")}</h2>
        <button className="text-sm text-teal-700 font-medium flex items-center gap-0.5 hover:underline">
          {t("cohortProgress.viewAll")}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-5">{t("cohortProgress.subtitle")}</p>

      <div className="space-y-5">
        {cohorts.map((cohort) => (
          <div key={cohort.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <p className="text-sm font-semibold text-gray-800">{cohort.name}</p>
                <p className="text-xs text-gray-500">{t("cohortProgress.activeParticipants", { count: cohort.active_participants })}</p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  cohort.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {cohort.status === "completed" ? t("cohortProgress.status.completed") : t("cohortProgress.status.inProgress")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    cohort.status === "completed" ? "bg-green-500" : "bg-teal-600"
                  }`}
                  style={{ width: `${Math.min(cohort.completion_pct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 w-9 text-right">
                {cohort.completion_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}