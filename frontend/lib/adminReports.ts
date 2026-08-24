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

export interface CohortOption {
  id: string;
  name: string;
}

export interface FetchReportsResult {
  success: boolean;
  reports?: ReportListItem[];
  status?: 401 | 403 | "error";
  error?: string;
}

export async function fetchAdminReports(): Promise<FetchReportsResult> {
  try {
    const response = await fetch(`${API_URL}/admin/reports`, {
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
      return { success: false, status: 403, error: "You do not have admin access to view this." };
    }
    return { success: false, status: "error", error: "Something went wrong loading reports." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface FetchCohortsResult {
  success: boolean;
  cohorts?: CohortOption[];
  error?: string;
}

export async function fetchCohortOptions(): Promise<FetchCohortsResult> {
  try {
    const response = await fetch(`${API_URL}/donor/dashboard/cohorts`, {
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 200) {
      const cohorts = await response.json();
      return { success: true, cohorts };
    }
    return { success: false, error: "Could not load cohorts." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export interface UploadReportResult {
  success: boolean;
  status?: 401 | 403 | 422 | "error";
  error?: string;
}

export type ReportScope = "single_cohort" | "multi_cohort";

export async function uploadReport(
  title: string,
  reportDate: string,
  cohortId: string | null,
  file: File,
  reportScope: ReportScope = "single_cohort"
): Promise<UploadReportResult> {
  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("report_date", reportDate);
    formData.append("report_scope", reportScope);
    // Only send cohort_id for single cohort reports
    if (reportScope === "single_cohort" && cohortId) {
      formData.append("cohort_id", cohortId);
    }
    formData.append("file", file);

    const response = await fetch(`${API_URL}/admin/reports`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });

    if (response.status === 201) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to upload reports." };
    }
    if (response.status === 422) {
      return { success: false, status: 422, error: data.detail ?? "Please check the file and form fields." };
    }
    return { success: false, status: "error", error: data.detail ?? "Something went wrong uploading the report." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface DeleteReportResult {
  success: boolean;
  error?: string;
}

export async function deleteReport(reportId: string): Promise<DeleteReportResult> {
  try {
    const response = await fetch(`${API_URL}/admin/reports/${reportId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 200) {
      return { success: true };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.detail ?? "Something went wrong deleting the report." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export interface FetchReportUrlResult {
  success: boolean;
  file_url?: string;
  status?: 401 | 404 | "error";
  error?: string;
}

export async function fetchReportUrl(reportId: string): Promise<FetchReportUrlResult> {
  try {
    const response = await fetch(`${API_URL}/admin/reports/${reportId}`, {
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
      return { success: false, status: 404, error: "Report not found." };
    }
    return { success: false, status: "error", error: "Something went wrong opening this report." };
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