import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Shared helper ─────────────────────────────────────────────────────────────

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, { headers: { ...getAuthHeaders() } });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

// ── Existing types (unchanged) ────────────────────────────────────────────────

export interface DashboardSummary {
  participants: number;
  graduation_rate: number;
  employment_rate: number;
  income_growth_multiplier: number;
  cohorts: number;
  refugee_participants_pct: number;
  international_roles_pct: number;
  african_companies_pct: number;
  income_sent_home_pct: number;
  updated_at: string;
}

export type CohortStatus = "completed" | "in_progress";

export interface Cohort {
  id: string;
  name: string;
  program: string;
  active_participants: number;
  completion_pct: number;
  graduation_pct: number | null;
  employment_rate: number | null;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
}

export interface Insight {
  title: string;
  body: string;
}

export interface BaselineData {
  avg_household_size: number;
  avg_pre_program_income: number;
  main_breadwinner_breakdown: Record<string, number>;
  avg_age: number;
  highest_education_common: string;
  employed_before_pct: number;
  employed_before_type_common: string;
}

export interface DistrictOrigin {
  district: string;
  participant_count: number;
  latitude: number | null;
  longitude: number | null;
}

export interface CountryOrigin {
  country: string;
  participant_count: number;
  latitude: number | null;
  longitude: number | null;
}

export interface OriginsData {
  uganda_districts: DistrictOrigin[];
  international: CountryOrigin[];
}

export interface DonorDashboardResult {
  success: boolean;
  summary?: DashboardSummary;
  cohorts?: Cohort[];
  insights?: Insight[];
  baseline?: BaselineData;
  origins?: OriginsData;
  status?: 401 | 403 | "error";
  error?: string;
}

// ── New cohort detail types ───────────────────────────────────────────────────

export interface CohortDetail {
  id: string;
  name: string;
  program: string;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
  active_participants: number;
  completion_pct: number;
  graduation_pct: number | null;
  employment_rate: number | null;
  avg_income_growth_multiplier: number | null;
}

export interface CohortTrack {
  id: string;
  name: string;
  participant_count: number;
  completion_pct: number;
  status: string;
}

export interface CohortOutcomes {
  employment_rate: number | null;
  avg_income_growth_multiplier: number | null;
  post_avg_monthly_income: number | null;
  african_companies_pct: number | null;
  global_companies_pct: number | null;
  notable_projects_count: number | null;
}

export interface CohortNarrative {
  professional_development: string | null;
  key_success_factors: string[] | null;
}

export interface CohortProject {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
}

// ── Result types ──────────────────────────────────────────────────────────────

export type CohortDetailResult =
  | { success: true; data: CohortDetail }
  | { success: false; error: string; status?: number };

export type CohortTracksResult =
  | { success: true; tracks: CohortTrack[] }
  | { success: false; error: string };

export type CohortOutcomesResult =
  | { success: true; outcomes: CohortOutcomes }
  | { success: false; error: string };

export type CohortBaselineResult =
  | { success: true; baseline: BaselineData }
  | { success: false; error: string };

export type CohortNarrativeResult =
  | { success: true; narrative: CohortNarrative }
  | { success: false; error: string };

export type CohortProjectsResult =
  | { success: true; projects: CohortProject[] }
  | { success: false; error: string };

// ── Existing fetch functions (unchanged) ──────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DonorDashboardResult> {
  try {
    const { status, body } = await get("/donor/dashboard/summary");
    if (status === 200) return { success: true, summary: body as DashboardSummary };
    if (status === 401) return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    if (status === 403) return { success: false, status: 403, error: "You do not have access to this page." };
    return { success: false, status: "error", error: "Something went wrong loading your dashboard." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchCohorts(): Promise<DonorDashboardResult> {
  try {
    const { status, body } = await get("/donor/dashboard/cohorts");
    if (status === 200) return { success: true, cohorts: body as Cohort[] };
    if (status === 401) return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    if (status === 403) return { success: false, status: 403, error: "You do not have access to this page." };
    return { success: false, status: "error", error: "Something went wrong loading cohort progress." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchInsights(): Promise<DonorDashboardResult> {
  try {
    const { status, body } = await get("/donor/dashboard/insights");
    if (status === 200) return { success: true, insights: body as Insight[] };
    if (status === 401) return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    if (status === 403) return { success: false, status: 403, error: "You do not have access to this page." };
    return { success: false, status: "error", error: "Something went wrong loading insights." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchBaseline(): Promise<DonorDashboardResult> {
  try {
    const { status, body } = await get("/donor/dashboard/baseline");
    if (status === 200) return { success: true, baseline: body as BaselineData };
    if (status === 401) return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    if (status === 403) return { success: false, status: 403, error: "You do not have access to this page." };
    return { success: false, status: "error", error: "Something went wrong loading baseline data." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchOrigins(): Promise<DonorDashboardResult> {
  try {
    const { status, body } = await get("/donor/dashboard/origins");
    if (status === 200) return { success: true, origins: body as OriginsData };
    if (status === 401) return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    if (status === 403) return { success: false, status: 403, error: "You do not have access to this page." };
    return { success: false, status: "error", error: "Something went wrong loading origin data." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

// ── New cohort detail fetch functions ─────────────────────────────────────────

export async function fetchCohortDetail(cohortId: string): Promise<CohortDetailResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}`);
    if (status === 200) return { success: true, data: body as CohortDetail };
    if (status === 401) return { success: false, error: "Session expired.", status: 401 };
    if (status === 404) return { success: false, error: "Cohort not found.", status: 404 };
    return { success: false, error: "Could not load cohort details." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortTracks(cohortId: string): Promise<CohortTracksResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}/tracks`);
    if (status === 200) return { success: true, tracks: body as CohortTrack[] };
    return { success: false, error: "Could not load tracks." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortBaseline(cohortId: string): Promise<CohortBaselineResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}/baseline`);
    if (status === 200) return { success: true, baseline: body as BaselineData };
    return { success: false, error: "Could not load baseline data." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortOutcomes(cohortId: string): Promise<CohortOutcomesResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}/outcomes`);
    if (status === 200) return { success: true, outcomes: body as CohortOutcomes };
    return { success: false, error: "Could not load outcomes." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortNarrative(cohortId: string): Promise<CohortNarrativeResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}/narrative`);
    if (status === 200) return { success: true, narrative: body as CohortNarrative };
    return { success: false, error: "Could not load narrative." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function fetchCohortProjects(cohortId: string): Promise<CohortProjectsResult> {
  try {
    const { status, body } = await get(`/donor/dashboard/cohorts/${cohortId}/projects`);
    if (status === 200) return { success: true, projects: body as CohortProject[] };
    return { success: false, error: "Could not load projects." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function downloadCohortReport(cohortId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/cohorts/${cohortId}/report`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) return { success: false, error: "Could not download report." };
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort-report-${cohortId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}