"use client";

import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import type { BaselineData } from "@/lib/donorDashboard";

export default function BaselinePanel({ baseline }: { baseline: BaselineData }) {
  const { t } = useTranslation("donor");

  const topBreadwinner = Object.entries(baseline.main_breadwinner_breakdown).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const rows = [
    { label: t("baseline.rows.avgHouseholdSize"), value: t("baseline.values.people", { count: baseline.avg_household_size }) },
    { label: t("baseline.rows.avgIncomePreProgram"), value: t("baseline.values.perMonth", { amount: baseline.avg_pre_program_income }) },
    {
      label: t("baseline.rows.mainBreadwinner"),
      value: topBreadwinner ? `${topBreadwinner[0]} (${topBreadwinner[1]}%)` : t("baseline.values.notAvailable"),
    },
    { label: t("baseline.rows.avgAge"), value: t("baseline.values.years", { count: baseline.avg_age }) },
    { label: t("baseline.rows.highestEducation"), value: baseline.highest_education_common },
    { label: t("baseline.rows.employedBefore"), value: t("baseline.values.informalPct", { pct: baseline.employed_before_pct }) },
    { label: t("baseline.rows.jobTypes"), value: baseline.employed_before_type_common },
  ];

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 h-fit">
      <div className="flex items-center gap-1.5 mb-1">
        <Info className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          {t("baseline.title")}
        </p>
      </div>
      <p className="text-xs text-gray-400 mb-4">{t("baseline.subtitle")}</p>

      <div className="divide-y divide-black/5">
        {rows.map((row) => (
          <div key={row.label} className="py-3 first:pt-0 last:pb-0">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              {row.label}
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}