"use client";

import { MessageCircleQuestion, CheckCircle2, XCircle, Flag } from "lucide-react";
import type { QASummary } from "@/lib/qaAnalytics";

interface QASummaryCardsProps {
  summary: QASummary;
}

export default function QASummaryCards({ summary }: QASummaryCardsProps) {
  const cards = [
    { label: "Questions Today", value: summary.questions_today, icon: MessageCircleQuestion, color: "text-gray-800" },
    { label: "Answered", value: summary.answered, icon: CheckCircle2, color: "text-green-600" },
    { label: "Declined", value: summary.declined, icon: XCircle, color: "text-amber-600" },
    { label: "Flagged", value: summary.flagged, icon: Flag, color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-black/5 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase mt-1">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
