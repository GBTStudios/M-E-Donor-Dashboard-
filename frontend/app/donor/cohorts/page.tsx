"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Users, GraduationCap, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import DonorLayout from "@/components/donor/DonorLayout";
import { fetchCohorts, type Cohort } from "@/lib/donorDashboard";

// ── Extended cohort type with fields from updated contract ────────────────────

interface ExtendedCohort extends Cohort {
  start_date?: string;
  end_date?: string;
  graduation_pct?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return "Pending";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Pending";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function extractCohortNumber(name: string): string {
  const match = name.match(/C(\d+)$/i);
  return match ? `Cohort ${match[1]}` : name;
}

function extractTrack(name: string): string {
  return name.replace(/\s*C\d+$/i, "").trim();
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  );
}

// ── Cohort card ───────────────────────────────────────────────────────────────

function CohortCard({ cohort }: { cohort: ExtendedCohort }) {
  const track = extractTrack(cohort.name);
  const cohortLabel = extractCohortNumber(cohort.name);

  return (
    <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex flex-col gap-4">
      {/* Status + track */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={cohort.status} />
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mt-3 mb-0.5">Track</p>
          <p className="text-lg font-bold text-[#1A534A]">{track}</p>
          <p className="text-base font-semibold text-[#1A534A]">{cohortLabel}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5B7571]">
            <Users className="w-3.5 h-3.5" />
            <span>{cohort.active_participants} Participants</span>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#eaf5f0] rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1">Intake Date</p>
          <p className="text-sm font-semibold text-[#1A534A]">{formatDate(cohort.start_date)}</p>
        </div>
        <div className="bg-[#eaf5f0] rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1">
            {cohort.status === "completed" ? "Endline Date" : "Est. Endline"}
          </p>
          <p className={`text-sm font-semibold ${cohort.end_date ? "text-[#1A534A]" : "text-amber-600"}`}>
            {formatDate(cohort.end_date)}
          </p>
        </div>
      </div>

      {/* Graduation + Completion — completed cohorts only */}
      {cohort.status === "completed" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#eaf5f0] rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> Graduation
            </p>
            <p className="text-sm font-semibold text-[#1A534A]">
              {cohort.graduation_pct != null ? `${cohort.graduation_pct}%` : "—"}
            </p>
          </div>
          <div className="bg-[#eaf5f0] rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1">Completion</p>
            <p className="text-sm font-semibold text-[#1A534A]">{cohort.completion_pct}%</p>
          </div>
        </div>
      )}

      {/* Program lifecycle bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791]">Program Lifecycle</p>
          <p className={`text-[10px] font-bold ${cohort.completion_pct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {cohort.completion_pct}% Complete
          </p>
        </div>
        <div className="relative h-2 bg-[#eaf5f0] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              cohort.status === "completed" ? "bg-emerald-500" : "bg-[#1A534A]"
            }`}
            style={{ width: `${Math.min(cohort.completion_pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {["Intake", "Training", "Graduation", "Endline"].map((label) => (
            <p key={label} className="text-[9px] text-[#7C9791] uppercase tracking-wide">{label}</p>
          ))}
        </div>
      </div>

      {/* Placeholder for future detail data */}
      <div className="text-xs text-[#7C9791] italic border-t border-black/5 pt-3">
        Detailed outcomes available once backend endpoints are live.
      </div>
    </div>
  );
}

// ── All cohorts tab ───────────────────────────────────────────────────────────

function AllCohortsView({ cohorts }: { cohorts: ExtendedCohort[] }) {
  if (cohorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="w-8 h-8 text-[#7C9791] mb-3" />
        <p className="text-sm font-semibold text-[#1A534A]">No cohorts yet</p>
        <p className="text-xs text-[#5B7571] mt-1">Cohorts will appear here once they are created.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {cohorts.map((cohort) => (
        <CohortCard key={cohort.id} cohort={cohort} />
      ))}
    </div>
  );
}

// ── Single cohort tab ─────────────────────────────────────────────────────────

function SingleCohortView({ cohort }: { cohort: ExtendedCohort }) {
  return (
    <div className="max-w-2xl">
      <CohortCard cohort={cohort} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CohortsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cohorts, setCohorts] = useState<ExtendedCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchCohorts();
    setLoading(false);

    if (!result.success) {
      if (result.status === 401) { router.replace("/login"); return; }
      setError(result.error ?? "Could not load cohorts.");
      return;
    }

    const data = (result.cohorts ?? []) as ExtendedCohort[];
    setCohorts(data);

    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "all" || data.some((c) => c.id === tabParam))) {
      setActiveTab(tabParam);
    }
  }, [router, searchParams]);

  useEffect(() => { load(); }, [load]);

  const activeCohort = cohorts.find((c) => c.id === activeTab) ?? null;

  return (
    <DonorLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7C9791] mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Regional Impact Groups
          </p>
          <h1 className="text-3xl font-bold text-[#1A534A]">Program Cohorts</h1>
          <p className="text-sm text-[#5B7571] mt-2 max-w-xl">
            Review detailed progress and performance metrics across historical and active program cycles.
            Data transparency is maintained through standardised outcome assessments at intake, graduation, and endline.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 border-b border-black/10">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === "all"
                    ? "border-[#1A534A] text-[#1A534A]"
                    : "border-transparent text-[#5B7571] hover:text-[#1A534A]"
                }`}
              >
                All Cohorts
              </button>
              {cohorts.map((cohort) => (
                <button
                  key={cohort.id}
                  type="button"
                  onClick={() => setActiveTab(cohort.id)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === cohort.id
                      ? "border-[#1A534A] text-[#1A534A]"
                      : "border-transparent text-[#5B7571] hover:text-[#1A534A]"
                  }`}
                >
                  {extractCohortNumber(cohort.name)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "all" ? (
              <AllCohortsView cohorts={cohorts} />
            ) : activeCohort ? (
              <SingleCohortView cohort={activeCohort} />
            ) : null}
          </>
        )}
      </div>
    </DonorLayout>
  );
}
