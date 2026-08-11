import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UploadedReport {
  id: string;
  title: string;
  description?: string;
  category?: string;
  uploaded_at: string;
  file_url: string;
}

export interface FetchReportsResult {
  success: boolean;
  reports?: UploadedReport[];
  status?: 401 | 403 | "error";
  error?: string;
}

// Backend endpoint GET /donor/dashboard/reports is still in progress on the
// admin-uploaded-reports feature. Shape here follows the current contract;
// confirm field names once that branch is pushed and adjust if needed.
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
