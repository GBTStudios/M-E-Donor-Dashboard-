"use client";

import { Info } from "lucide-react";
import type { BaselineData } from "@/lib/donorDashboard";

export default function BaselinePanel({ baseline }: { baseline: BaselineData }) {
  const topBreadwinner = Object.entries(baseline.main_breadwinner_breakdown).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const rows = [
    { label: "Avg. Household Size", value: `${baseline.avg_household_size} People` },
    { label: "Avg. Income Pre-Program", value: `$${baseline.avg_pre_program_income} / mo` },
    {
      label: "Main Breadwinner",
      value: topBreadwinner ? `${topBreadwinner[0]} (${topBreadwinner[1]}%)` : "—",
    },
    { label: "Avg. Age", value: `${baseline.avg_age} Years` },
    { label: "Highest Education", value: baseline.highest_education_common },
    { label: "Employed Before", value: `${baseline.employed_before_pct}% (Informal)` },
    { label: "Job Types", value: baseline.employed_before_type_common },
  ];

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5 h-fit">
      <div className="flex items-center gap-1.5 mb-1">
        <Info className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Before the Program
        </p>
      </div>
      <p className="text-xs text-gray-400 mb-4">Aggregated data collected at enrollment phase.</p>

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
