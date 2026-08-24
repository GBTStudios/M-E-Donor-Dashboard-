"use client";
import { useTranslation } from "react-i18next";
import { Lightbulb } from "lucide-react";
import type { Insight } from "@/lib/donorDashboard";

export default function StrategicInsights({ insights }: { insights: Insight[] }) {
  const { t } = useTranslation("donor");

  if (insights.length === 0) {
    return null;
  }
  return (
    <div className="bg-[#1A534A] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-white" />
        <h2 className="text-base font-semibold text-white">{t("insights.title")}</h2>
      </div>
      <p className="text-xs text-white/60 mb-4">{t("insights.subtitle")}</p>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={`${insight.title}-${index}`} className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white">{insight.title}</p>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{insight.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}