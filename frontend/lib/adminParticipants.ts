import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ImportStatus = "processing" | "pending_review" | "confirmed" | "rejected" | "failed";

export interface ImportRecord {
  id: string;
  filename: string;
  file_type: string;
  status: ImportStatus;
  row_count: number | null;
  preview_data: {
    columns?: string[];
    sample_rows?: Record<string, unknown>[];
    error?: string;
  } | null;
  uploaded_by: string;
  created_at: string;
  confirmed_at: string | null;
}

export interface ParticipantImportResult {
  success: boolean;
  import?: ImportRecord;
  status?: 401 | 403 | 404 | 409 | 422 | "error";
  error?: string;
}

export async function uploadParticipantFile(file: File): Promise<ParticipantImportResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/admin/participants/import`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });

    if (response.status === 202) {
      const imported = await response.json();
      return { success: true, import: imported };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 422) {
      return { success: false, status: 422, error: "Please upload an Excel, CSV, PDF, or DOCX file under 25MB." };
    }

    return { success: false, status: "error", error: "Something went wrong uploading the file." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchImportDetail(id: string): Promise<ParticipantImportResult> {
  try {
    const response = await fetch(`${API_URL}/admin/participants/imports/${id}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const imported = await response.json();
      return { success: true, import: imported };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to view this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This import no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong loading this import." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function confirmImport(id: string): Promise<ParticipantImportResult> {
  try {
    const response = await fetch(`${API_URL}/admin/participants/imports/${id}/confirm`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      return { success: true };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This import no longer exists." };
    }
    if (response.status === 409) {
      return { success: false, status: 409, error: "This import can't be confirmed right now (it may already be confirmed, rejected, or still processing)." };
    }

    return { success: false, status: "error", error: "Something went wrong confirming this import." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function rejectImport(id: string): Promise<ParticipantImportResult> {
  try {
    const response = await fetch(`${API_URL}/admin/participants/imports/${id}/reject`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      return { success: true };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This import no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong rejecting this import." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface DeleteImportResult {
  success: boolean;
  message?: string;
  deletedParticipantCount?: number;
  status?: 401 | 403 | 404 | 409 | "error";
  error?: string;
}

export async function deleteImport(id: string, confirmCascade = false): Promise<DeleteImportResult> {
  try {
    const url = confirmCascade
      ? `${API_URL}/admin/participants/imports/${id}?confirm_cascade=true`
      : `${API_URL}/admin/participants/imports/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        message: data.message,
        deletedParticipantCount: data.row_count ?? 0,
      };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This import no longer exists." };
    }
    if (response.status === 409) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        status: 409,
        error: data.detail ?? "This import can't be deleted yet.",
      };
    }

    return { success: false, status: "error", error: "Something went wrong deleting this import." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface ImportHistoryResult {
  success: boolean;
  imports?: ImportRecord[];
  status?: 401 | 403 | "error";
  error?: string;
}

export async function fetchImportHistory(): Promise<ImportHistoryResult> {
  try {
    const response = await fetch(`${API_URL}/admin/participants/imports`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const imports = await response.json();
      return { success: true, imports };
    }
    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to view this." };
    }

    return { success: false, status: "error", error: "Something went wrong loading import history." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}