"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Upload,
  BarChart3,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Wifi,
  Zap,
  Database,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  getDashboardStats,
  getNeedsAttention,
  getSystemHealth,
  type DashboardStats,
  type AttentionItem,
  type SystemHealth,
} from "@/lib/adminDashboard";

const ACCESS_TOKEN_KEY = "access_token";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(status: string): string {
  if (status === "ok") return "text-emerald-600 dark:text-emerald-400";
  if (status === "degraded") return "text-amber-500";
  return "text-red-500";
}

// Overall banner state derived from the individual health signals, rather
// than just "did the health endpoint respond at all". Any non-"ok" status
// on either the database or the API downgrades the banner.
type OverallStatus = "ok" | "degraded" | "down";

function overallStatus(health: SystemHealth | null): OverallStatus | null {
  if (!health) return null;
  if (health.databaseStatus === "down" || health.apiStatus === "down") return "down";
  if (health.databaseStatus !== "ok" || health.apiStatus !== "ok") return "degraded";
  return "ok";
}

const OVERALL_BANNER_STYLES: Record<OverallStatus, { wrap: string; dot: string; text: string; label: string }> = {
  ok: {
    wrap: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "All Systems Operational",
  },
  degraded: {
    wrap: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    label: "Degraded Performance",
  },
  down: {
    wrap: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    label: "System Outage Detected",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  comingSoon,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  comingSoon?: boolean;
}) {
  return (
    <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 text-[#1A534A] dark:text-[#7dd3c0]" />
        {comingSoon && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
            Soon
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#1A534A] dark:text-[#7dd3c0]">
        {value !== null ? value.toLocaleString() : "—"}
      </p>
      <p className="text-xs text-[#5B7571] dark:text-[#8fada9] font-medium">{label}</p>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-[#1A534A] dark:text-[#7dd3c0]">{title}</h2>
      {action}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    const [statsResult, attentionResult, healthResult] = await Promise.all([
      getDashboardStats(accessToken),
      getNeedsAttention(accessToken),
      getSystemHealth(accessToken),
    ]);

    if (statsResult.success) {
  setStats(statsResult.stats);
} else {
  const { status, message } = statsResult as { success: false; message: string; status: number };
  if (status === 403) {
    router.replace("/login");
    return;
  }
  setError(message);
}

    if (attentionResult.success) setAttentionItems(attentionResult.items);
    if (healthResult.success) setHealth(healthResult.health);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
        </div>
      </AdminLayout>
    );
  }

  const overall = overallStatus(health);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1A534A] dark:text-[#7dd3c0] mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-[#5B7571] dark:text-[#8fada9] mb-8">
          Platform health, document status, and quick actions.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Document + user stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText} label="Documents Uploaded" value={stats?.documentsUploaded ?? null} />
          <StatCard icon={Clock} label="Pending Review" value={stats?.pendingReview ?? null} />
          <StatCard icon={CheckCircle2} label="Published" value={stats?.published ?? null} />
          <StatCard icon={Users} label="Active Users" value={stats?.activeUsers ?? null} />
        </div>

        {/* Chatbot stats */}
        {stats?.conversationsReady ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon={MessageSquare} label="Questions Today" value={stats.questionsToday} />
            <StatCard icon={ThumbsUp} label="Answered" value={stats.answered} />
            <StatCard icon={ThumbsDown} label="Declined" value={stats.declined} />
            <StatCard icon={Flag} label="Flagged" value={stats.flagged} />
          </div>
        ) : (
          <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-5 shadow-sm mb-8 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[#7C9791] dark:text-[#5a9e94] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0]">
                Chatbot analytics coming soon
              </p>
              <p className="text-xs text-[#5B7571] dark:text-[#8fada9] mt-0.5">
                Questions, answers, and flagged conversations will appear here once the chatbot system is live.
              </p>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Needs Your Attention */}
          <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
            <SectionHeader
              title="Needs Your Attention"
              action={
                <Link
                  href="/admin/documents"
                  className="text-xs font-semibold text-[#1A534A] dark:text-[#7dd3c0] hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            {attentionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#7C9791] dark:text-[#5a9e94] mb-2" />
                <p className="text-sm text-[#5B7571] dark:text-[#8fada9]">All caught up!</p>
                <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] mt-0.5">
                  No documents pending review.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {attentionItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A534A] dark:text-[#7dd3c0] truncate">
                        {item.filename}
                      </p>
                      <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] mt-0.5">
                        By {item.uploadedByName ?? "Unknown"} · {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    <Link
                      href="/admin/documents"
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-[#1A534A] dark:bg-[#2a6b5e] hover:bg-[#134038] px-3 py-1.5 rounded-full transition-colors"
                    >
                      Review <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Integrity */}
          <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
            <SectionHeader title="Infrastructure Integrity" />
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#7C9791] dark:text-[#5a9e94]" />
                    <span className="text-xs font-medium text-[#5B7571] dark:text-[#8fada9]">VDB Connectivity</span>
                  </div>
                  <span className="text-xs font-bold text-[#1A534A] dark:text-[#7dd3c0]">
                    {stats?.vectorDbConnectivityPct != null ? `${stats.vectorDbConnectivityPct}%` : "—"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1A534A] dark:bg-[#2a6b5e] transition-all"
                    style={{ width: `${stats?.vectorDbConnectivityPct ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#7C9791] dark:text-[#5a9e94]" />
                  <span className="text-xs font-medium text-[#5B7571] dark:text-[#8fada9]">Query Latency (Avg)</span>
                </div>
                <span className="text-xs font-bold text-[#1A534A] dark:text-[#7dd3c0]">
                  {stats?.queryLatencyMs != null ? `${stats.queryLatencyMs}ms` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#7C9791] dark:text-[#5a9e94]" />
                  <span className="text-xs font-medium text-[#5B7571] dark:text-[#8fada9]">Database</span>
                </div>
                <span className={`text-xs font-bold capitalize ${health ? statusColor(health.databaseStatus) : "text-[#7C9791]"}`}>
                  {health ? `${health.databaseStatus} · ${Math.round(health.databaseLatencyMs)}ms` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7C9791] dark:text-[#5a9e94]" />
                  <span className="text-xs font-medium text-[#5B7571] dark:text-[#8fada9]">API Status</span>
                </div>
                <span className={`text-xs font-bold capitalize ${health ? statusColor(health.apiStatus) : "text-[#7C9791]"}`}>
                  {health?.apiStatus ?? "—"}
                </span>
              </div>

              {overall && (
                <div className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 ${OVERALL_BANNER_STYLES[overall].wrap}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${OVERALL_BANNER_STYLES[overall].dot}`} />
                  <span className={`text-xs font-semibold ${OVERALL_BANNER_STYLES[overall].text}`}>
                    {OVERALL_BANNER_STYLES[overall].label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Controls */}
        <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-5 shadow-sm">
          <SectionHeader title="Maintenance Controls" />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/documents"
              className="flex items-center gap-2 bg-[#1A534A] dark:bg-[#2a6b5e] hover:bg-[#134038] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload New Documentation
            </Link>
            <button
              type="button"
              disabled
              title="Available once conversation data exists"
              className="flex items-center gap-2 bg-white/60 dark:bg-white/10 text-[#5B7571] dark:text-[#8fada9] text-sm font-semibold px-5 py-2.5 rounded-full border border-black/10 dark:border-white/10 cursor-not-allowed opacity-60"
            >
              <BarChart3 className="w-4 h-4" />
              Export Response Analytics
            </button>
          </div>
          <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] mt-3">
            Export Response Analytics will be enabled once conversation data is available.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
