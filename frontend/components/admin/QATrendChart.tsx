"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TrendData } from "@/lib/qaAnalytics";

interface QATrendChartProps {
  trends: TrendData;
}

export default function QATrendChart({ trends }: QATrendChartProps) {
  if (trends.data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center text-sm text-gray-400">
        No conversation data for this period yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-800 mb-4">
        Conversations Over Time — Answered vs Declined vs Flagged
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="answered" stroke="#16a34a" strokeWidth={2} name="Answered" />
            <Line type="monotone" dataKey="declined" stroke="#d97706" strokeWidth={2} name="Declined" />
            <Line type="monotone" dataKey="flagged" stroke="#ef4444" strokeWidth={2} name="Flagged" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
