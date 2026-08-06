"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import QASummaryCards from "@/components/admin/QASummaryCards";
import QATrendChart from "@/components/admin/QATrendChart";
import QADateFilter from "@/components/admin/QADateFilter";
import FlaggedConversationsList from "@/components/admin/FlaggedConversationsList";
import { fetchQASummary, fetchQATrends, QASummary, TrendData } from "@/lib/qaAnalytics";

export default function QALogsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<QASummary | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [summaryResult, trendsResult] = await Promise.all([
      fetchQASummary(),
      fetchQATrends(period),
    ]);

    if (summaryResult.status === 401 || trendsResult.status === 401) {
      router.replace("/login");
      return;
    }

    if (summaryResult.status === 403 || trendsResult.status === 403) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    if (summaryResult.success && summaryResult.summary) {
      setSummary(summaryResult.summary);
    } else {
      setError(summaryResult.error ?? "Could not load summary.");
    }

    if (trendsResult.success && trendsResult.trends) {
      setTrends(trendsResult.trends);
    }

    setLoading(false);
  }, [period, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (accessDenied) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h1 className="text-lg font-semibold text-gray-800">Access denied</h1>
          <p className="text-sm text-gray-500 mt-1">
            You do not have admin access to view this page.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A534A]">Q&amp;A Logs</h1>
          <p className="text-sm text-[#5B7571] mt-1">
            Track daily conversational totals and review flagged interactions.
          </p>
        </div>
        <QADateFilter period={period} onChange={setPeriod} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {summary && <QASummaryCards summary={summary} />}
          {trends && <QATrendChart trends={trends} />}
        </div>
      )}

      <div className="mt-10">
        <FlaggedConversationsList />
      </div>
    </AdminLayout>
  );
}
