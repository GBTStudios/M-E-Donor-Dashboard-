import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  active_participants: number;
  completion_pct: number;
  status: CohortStatus;
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

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, { headers: { ...getAuthHeaders() } });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

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
