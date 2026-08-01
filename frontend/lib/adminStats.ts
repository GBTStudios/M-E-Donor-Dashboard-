import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AdminStats {
  id: string;
  participants: number;
  graduation_rate: number;
  employment_rate: number;
  income_growth_multiplier: number;
  cohorts: number;
  refugee_participants_pct: number;
  updated_at: string;
  updated_by: string | null;
}

export type StatsFieldErrors = Partial<Record<keyof AdminStats, string>>;

export interface StatsResult {
  success: boolean;
  stats?: AdminStats;
  status?: 401 | 403 | 422 | "error";
  error?: string;
  fieldErrors?: StatsFieldErrors;
}

export async function fetchAdminStats(): Promise<StatsResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stats/landing-summary`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const stats = await response.json();
      return { success: true, stats };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading the stats." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function updateAdminStats(
  changes: Partial<Omit<AdminStats, "id" | "updated_at" | "updated_by">>
): Promise<StatsResult> {
  try {
    const response = await fetch(`${API_URL}/admin/stats/landing-summary`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(changes),
    });

    if (response.status === 200) {
      const stats = await response.json();
      return { success: true, stats };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to make this change." };
    }

    if (response.status === 422) {
      const data = await response.json().catch(() => ({}));
      const fieldErrors: StatsFieldErrors = {};

      if (Array.isArray(data.detail)) {
        for (const err of data.detail) {
          const field = err.loc?.[err.loc.length - 1];
          if (field) fieldErrors[field as keyof AdminStats] = err.msg;
        }
      }

      return {
        success: false,
        status: 422,
        error: "Some values are invalid. Check the highlighted fields below.",
        fieldErrors,
      };
    }

    return { success: false, status: "error", error: "Something went wrong saving the stats." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}
