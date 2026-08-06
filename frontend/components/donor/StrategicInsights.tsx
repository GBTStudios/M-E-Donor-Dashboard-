"use client";

import { Lightbulb } from "lucide-react";
import type { Insight } from "@/lib/donorDashboard";

export default function StrategicInsights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1A534A] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-white" />
        <h2 className="text-base font-semibold text-white">Strategic Insights</h2>
      </div>
      <p className="text-xs text-white/60 mb-4">Key observations from recent data cycles</p>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.title} className="bg-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white">{insight.title}</p>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{insight.body}</p>
          </div>
        ))}
      </div>

      <button
        disabled
        title="Coming soon"
        className="w-full mt-4 bg-white/10 text-white/50 text-sm font-medium py-2.5 rounded-lg cursor-not-allowed"
      >
        Request Detailed Analysis
      </button>
    </div>
  );
}
