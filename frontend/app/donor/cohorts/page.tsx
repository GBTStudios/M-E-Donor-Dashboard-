"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, Users, GraduationCap, CheckCircle2, Clock, AlertTriangle,
  Search, SlidersHorizontal, Download, TrendingUp, Briefcase, Info,
  ArrowRight, ChevronRight, X, ArrowUpDown,
} from "lucide-react";
import DonorLayout from "@/components/donor/DonorLayout";
import ProjectCarousel from "@/components/donor/ProjectCarousel";
import {
  fetchCohorts, fetchCohortDetail, fetchCohortTracks, fetchCohortBaseline,
  fetchCohortOutcomes, fetchCohortNarrative, fetchCohortProjects, downloadCohortReport,
  type Cohort, type CohortDetail, type CohortTrack, type BaselineData,
  type CohortOutcomes, type CohortNarrative, type CohortProject,
} from "@/lib/donorDashboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Pending";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Pending";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function cohortTabLabel(name: string): string {
  const match = name.match(/(\d+)$/);
  return match ? `Cohort ${match[1]}` : name;
}

function avg(values: (number | null | undefined)[]): number {
  const valid = values.filter((v) => v != null) as number[];
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
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

// ── Lifecycle bar ─────────────────────────────────────────────────────────────

function LifecycleBar({ pct, status }: { pct: number; status: string }) {
  const stages = ["Intake", "Training", "Graduation", "Endline"];
  const stagePositions = [0, 33, 66, 100];
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791]">Program Lifecycle</p>
        <p className={`text-[10px] font-bold ${pct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
          {pct}% Complete
        </p>
      </div>
      <div className="relative h-2 bg-[#eaf5f0] rounded-full">
        <div
          className={`h-full rounded-full transition-all ${status === "completed" ? "bg-emerald-500" : "bg-[#1A534A]"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
        {stagePositions.map((pos, i) => (
          <div
            key={i}
            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white ${
              pos <= pct ? (status === "completed" ? "bg-emerald-500" : "bg-[#1A534A]") : "bg-[#eaf5f0]"
            }`}
            style={{ left: `calc(${pos}% - 4px)` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {stages.map((label) => (
          <p key={label} className="text-[9px] text-[#7C9791] uppercase tracking-wide">{label}</p>
        ))}
      </div>
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────────────────────

function SummaryStatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white rounded-2xl border border-black/10 p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-[#eaf5f0] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#1A534A]" />
      </div>
      <div>
        <p className="text-xl font-bold text-[#1A534A]">{value}</p>
        <p className="text-xs text-[#5B7571]">{label}</p>
      </div>
    </div>
  );
}

// ── Cohort summary card ───────────────────────────────────────────────────────

function CohortSummaryCard({ cohort, onTabClick }: { cohort: Cohort; onTabClick: (id: string) => void }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    await downloadCohortReport(cohort.id);
    setDownloading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex flex-col gap-4">
      <div>
        <StatusBadge status={cohort.status} />
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mt-3 mb-0.5">Track</p>
        <p className="text-lg font-bold text-[#1A534A]">{cohort.program ?? cohort.name}</p>
        {cohort.program && <p className="text-base font-semibold text-[#1A534A]">{cohort.name}</p>}
        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#5B7571]">
          <Users className="w-3.5 h-3.5" />
          <span>{cohort.active_participants} Participants</span>
        </div>
      </div>

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
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Employment
            </p>
            <p className="text-sm font-semibold text-[#1A534A]">
              {cohort.employment_rate != null ? `${cohort.employment_rate}%` : "—"}
            </p>
          </div>
        </div>
      )}

      <LifecycleBar pct={cohort.completion_pct} status={cohort.status} />

      <div className="flex items-center justify-between pt-1 border-t border-black/5">
        <button
          type="button"
          onClick={() => onTabClick(cohort.id)}
          className="flex items-center gap-1 text-xs font-semibold text-[#1A534A] hover:underline"
        >
          View Details <ChevronRight className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1A534A] hover:bg-[#134038] disabled:opacity-60 px-3 py-1.5 rounded-full transition-colors"
        >
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Download Report
        </button>
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white rounded-2xl border border-black/10 p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791]">{label}</p>
        <Icon className="w-4 h-4 text-[#7C9791]" />
      </div>
      <p className="text-3xl font-bold text-[#1A534A]">{value}</p>
    </div>
  );
}

// ── Cohort detail view ────────────────────────────────────────────────────────

function CohortDetailView({ cohortId, cohortName }: { cohortId: string; cohortName: string }) {
  const [detail, setDetail] = useState<CohortDetail | null>(null);
  const [tracks, setTracks] = useState<CohortTrack[]>([]);
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [outcomes, setOutcomes] = useState<CohortOutcomes | null>(null);
  const [narrative, setNarrative] = useState<CohortNarrative | null>(null);
  const [projects, setProjects] = useState<CohortProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [detailRes, tracksRes, baselineRes, outcomesRes, narrativeRes, projectsRes] =
        await Promise.all([
          fetchCohortDetail(cohortId),
          fetchCohortTracks(cohortId),
          fetchCohortBaseline(cohortId),
          fetchCohortOutcomes(cohortId),
          fetchCohortNarrative(cohortId),
          fetchCohortProjects(cohortId),
        ]);
      if (detailRes.success) setDetail(detailRes.data);
      if (tracksRes.success) setTracks(tracksRes.tracks);
      if (baselineRes.success) setBaseline(baselineRes.baseline);
      if (outcomesRes.success) setOutcomes(outcomesRes.outcomes);
      if (narrativeRes.success) setNarrative(narrativeRes.narrative);
      if (projectsRes.success) setProjects(projectsRes.projects);
      setLoading(false);
    }
    load();
  }, [cohortId]);

  async function handleDownload() {
    setDownloading(true);
    await downloadCohortReport(cohortId);
    setDownloading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="w-8 h-8 text-[#7C9791] mb-3" />
        <p className="text-sm text-[#5B7571]">Could not load cohort details.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white rounded-2xl border border-black/10 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {detail?.program && (
            <span className="text-xs font-semibold bg-[#eaf5f0] text-[#1A534A] px-3 py-1 rounded-full">
              {detail.program}
            </span>
          )}
          {detail && <StatusBadge status={detail.status} />}
        </div>
        {(detail?.start_date || detail?.end_date) && (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791]">Program Duration</p>
            <p className="text-sm font-semibold text-[#1A534A]">
              {formatDate(detail.start_date)} — {formatDate(detail.end_date)}
            </p>
          </div>
        )}
      </div>

      {/* KPI cards */}
      {detail && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Total Participants" value={String(detail.active_participants)} icon={Users} />
          <KpiCard label="Completion Rate" value={`${detail.completion_pct}%`} icon={CheckCircle2} />
          <KpiCard label="Employment Rate" value={detail.employment_rate != null ? `${detail.employment_rate}%` : "—"} icon={Briefcase} />
          <KpiCard label="Avg Income Growth" value={detail.avg_income_growth_multiplier != null ? `${detail.avg_income_growth_multiplier}x` : "—"} icon={TrendingUp} />
        </div>
      )}

      {/* Tracks */}
      {tracks.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1A534A] mb-1">Tracks</h3>
          <p className="text-xs text-[#5B7571] mb-4">Percentages of different tracks across the cohort</p>
          <div className="flex flex-col gap-4">
            {tracks.map((track) => (
              <div key={track.id}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-[#1A534A]">{track.name}</p>
                    <p className="text-xs text-[#5B7571]">{track.participant_count} Participants</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={track.status} />
                    <span className="text-xs font-bold text-[#1A534A]">{track.completion_pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#eaf5f0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${track.status === "completed" ? "bg-emerald-500" : "bg-[#1A534A]"}`}
                    style={{ width: `${Math.min(track.completion_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Before / After */}
      {(baseline || outcomes) && (
        <div className="grid sm:grid-cols-2 gap-5 items-start">
          {baseline && (
            <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1">Before the Programme</p>
              <p className="text-xs text-[#5B7571] mb-4">Self-reported pre-program values (USD)</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Avg. Monthly Income", sublabel: "Pre-program average", value: `$${baseline.avg_pre_program_income}` },
                  { label: "Avg. Household Size", sublabel: "Individuals per home", value: String(baseline.avg_household_size) },
                  { label: "Prior Employment", sublabel: "Informal/Unstable", value: `${baseline.employed_before_pct}%` },
                  { label: "Highest Education", sublabel: "Secondary school", value: baseline.highest_education_common },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                    <div>
                      <p className="text-xs font-semibold text-[#1A534A]">{row.label}</p>
                      <p className="text-[10px] text-[#7C9791]">{row.sublabel}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A534A]">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-[#7C9791]">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <p>Baseline data represents the socio-economic status of participants upon entry.</p>
              </div>
            </div>
          )}

          {outcomes && (
            <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-1">After the Programme</p>
              <p className="text-xs text-[#5B7571] mb-4">Post-program verified professional metrics</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Avg. Monthly Income", sublabel: "25x increase avg.", value: outcomes.post_avg_monthly_income != null ? `$${outcomes.post_avg_monthly_income}` : "—" },
                  { label: "Employment Rate", sublabel: "High-growth tech roles", value: outcomes.employment_rate != null ? `${outcomes.employment_rate}%` : "—" },
                  { label: "African Companies", sublabel: "Local tech ecosystem", value: outcomes.african_companies_pct != null ? `${outcomes.african_companies_pct}%` : "—" },
                  { label: "Global/Intl Companies", sublabel: "Remote/Global export", value: outcomes.global_companies_pct != null ? `${outcomes.global_companies_pct}%` : "—" },
                  { label: "Notable Projects", sublabel: "Production-ready apps", value: outcomes.notable_projects_count != null ? `${outcomes.notable_projects_count}+` : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-black/5 pb-2">
                    <div>
                      <p className="text-xs font-semibold text-[#1A534A]">{row.label}</p>
                      <p className="text-[10px] text-[#7C9791]">{row.sublabel}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A534A]">{row.value}</p>
                  </div>
                ))}
              </div>
              {detail?.avg_income_growth_multiplier != null && (
                <div className="mt-4 bg-[#1A534A] rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/60 mb-1">Strategic Insight</p>
                  <p className="text-xs text-white leading-relaxed">
                    The {detail.avg_income_growth_multiplier}x income growth observed in {cohortName} represents our highest mobility rate to date.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exchange rate footnote */}
      {(baseline || outcomes) && (
        <p className="text-[10px] text-amber-600 italic">
          Results data conversion calculated using a historical average exchange rate of 1 USD = 3,750 UGX for the duration of the program.
        </p>
      )}

      {/* Notable Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1A534A]">Notable Projects</h3>
          <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[#1A534A] hover:underline">
            View participant stories <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <ProjectCarousel projects={projects} />
      </div>

      {/* Impact Narrative */}
      {narrative && (narrative.professional_development || (narrative.key_success_factors ?? []).length > 0) && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1A534A] mb-1">Impact Narrative</h3>
          <p className="text-xs text-[#5B7571] mb-4">Qualitative growth observations</p>
          {narrative.professional_development && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-2">Professional Development</p>
              <p className="text-sm text-[#5B7571] leading-relaxed">{narrative.professional_development}</p>
            </div>
          )}
          {(narrative.key_success_factors ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] mb-2">Key Success Factors</p>
              <ul className="flex flex-col gap-1.5">
                {(narrative.key_success_factors ?? []).map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5B7571]">
                    <span className="text-[#1A534A] mt-0.5">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-full transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Cohort Impact Report
          </button>
        </div>
      )}
    </div>
  );
}

// ── All cohorts view ──────────────────────────────────────────────────────────

type SortKey = "default" | "graduation" | "completion";
type FilterStatus = "all" | "completed" | "in_progress";

function AllCohortsView({ cohorts, onTabClick }: { cohorts: Cohort[]; onTabClick: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [showFilters, setShowFilters] = useState(false);

  const totalParticipants = cohorts.reduce((s, c) => s + c.active_participants, 0);
  const avgGraduation = avg(cohorts.map((c) => c.graduation_pct));
  const avgCompletion = avg(cohorts.map((c) => c.completion_pct));
  const completed = cohorts.filter((c) => c.status === "completed").length;

  let filtered = cohorts.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.program ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (sortKey === "graduation") {
    filtered = [...filtered].sort((a, b) => (b.graduation_pct ?? 0) - (a.graduation_pct ?? 0));
  } else if (sortKey === "completion") {
    filtered = [...filtered].sort((a, b) => b.completion_pct - a.completion_pct);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStatCard label="Total Cohorts" value={String(cohorts.length)} icon={Users} />
        <SummaryStatCard label="Total Participants" value={String(totalParticipants)} icon={Users} />
        <SummaryStatCard label="Avg Graduation Rate" value={avgGraduation ? `${avgGraduation}%` : "—"} icon={GraduationCap} />
        <SummaryStatCard label="Avg Completion" value={`${avgCompletion}%`} icon={CheckCircle2} />
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9791]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks or names..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm text-[#1A534A] placeholder:text-[#7C9791] focus:outline-none focus:ring-2 focus:ring-[#1A534A]/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors ${
            showFilters
              ? "bg-[#1A534A] text-white border-transparent"
              : "bg-white text-[#1A534A] border-black/10 hover:bg-[#eaf5f0]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Advanced Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-black/10 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5B7571]">Status:</span>
            {(["all", "in_progress", "completed"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`capitalize text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  filterStatus === s ? "bg-[#1A534A] text-white" : "bg-[#eaf5f0] text-[#1A534A] hover:bg-[#d4ede7]"
                }`}
              >
                {s === "in_progress" ? "In Progress" : s === "all" ? "All" : "Completed"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5B7571]">Sort by:</span>
            {([["default", "Default"], ["graduation", "Graduation Rate"], ["completion", "Completion"]] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  sortKey === key ? "bg-[#1A534A] text-white" : "bg-[#eaf5f0] text-[#1A534A] hover:bg-[#d4ede7]"
                }`}
              >
                <ArrowUpDown className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
          {(filterStatus !== "all" || sortKey !== "default" || search) && (
            <button
              type="button"
              onClick={() => { setFilterStatus("all"); setSortKey("default"); setSearch(""); }}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline ml-auto"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Methodology banner */}
      <div className="flex items-start gap-3 bg-[#1A534A] text-white rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/70" />
        <div>
          <p className="text-sm font-semibold">Impact Methodology Update</p>
          <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
            Starting from Cohort 3, we implemented standardised surveying across all tracks to ensure long-term outcome comparability. Data for Cohorts 1 and 2 remains verified but utilises legacy categorisation metrics.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#5B7571]">
          Showing {filtered.length} of {cohorts.length} cohorts
          {completed > 0 && ` · ${completed} completed`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="w-8 h-8 text-[#7C9791] mb-3" />
          <p className="text-sm font-semibold text-[#1A534A]">No cohorts found</p>
          <p className="text-xs text-[#5B7571] mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((cohort) => (
            <CohortSummaryCard key={cohort.id} cohort={cohort} onTabClick={onTabClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CohortsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
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

    const data = result.cohorts ?? [];
    setCohorts(data);

    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "all" || data.some((c) => c.id === tabParam))) {
      setActiveTab(tabParam);
    }
  }, [router, searchParams]);

  useEffect(() => { load(); }, [load]);

  const activeCohort = cohorts.find((c) => c.id === activeTab);

  return (
    <DonorLayout>
      <div className="max-w-5xl mx-auto">
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
            <div className="flex items-center gap-1 overflow-x-auto pb-px mb-6 border-b border-black/10">
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
                  {cohortTabLabel(cohort.name)}
                </button>
              ))}
            </div>

            {activeTab === "all" ? (
              <AllCohortsView cohorts={cohorts} onTabClick={setActiveTab} />
            ) : activeCohort ? (
              <CohortDetailView cohortId={activeTab} cohortName={activeCohort.name} />
            ) : null}
          </>
        )}
      </div>
    </DonorLayout>
  );
}
