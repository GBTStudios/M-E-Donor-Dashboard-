import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ReportListItem {
  id: string;
  title: string;
  cohort_id: string | null;
  report_date: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export interface FetchReportsResult {
  success: boolean;
  reports?: ReportListItem[];
  status?: 401 | 403 | "error";
  error?: string;
}

export async function fetchReports(): Promise<FetchReportsResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/reports`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const reports = await response.json();
      return { success: true, reports };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have access to this page." };
    }
    return { success: false, status: "error", error: "Something went wrong loading reports." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface FetchCohortReportResult {
  success: boolean;
  file_url?: string;
  status?: 401 | 404 | "error";
  error?: string;
}

// Donors can only reach a report's file_url via its cohort's latest report,
// not by report id directly — that's the current backend contract. Only
// call this for reports that have a cohort_id.
export async function fetchCohortReportUrl(cohortId: string): Promise<FetchCohortReportResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/cohorts/${cohortId}/report`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const data = await response.json();
      return { success: true, file_url: data.file_url };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "No report found for this cohort." };
    }
    return { success: false, status: "error", error: "Something went wrong opening this report." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface DownloadImpactSummaryResult {
  success: boolean;
  status?: 401 | "error";
  error?: string;
}

// Response is a raw PDF (application/pdf), not JSON, so this can't be a
// plain <a href>: the Authorization header has to be attached manually,
// which means fetching as a blob and triggering the download via a
// temporary object URL.
export async function downloadImpactSummary(): Promise<DownloadImpactSummaryResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/reports/impact-summary/export`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (!response.ok) {
      return { success: false, status: "error", error: "Something went wrong generating the report." };
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `impact-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}
