import { getAuthHeaders } from "@/lib/auth";
import type { DocumentStatus } from "@/lib/adminDocuments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuditDocument {
  id: string;
  display_id: string;
  filename: string;
  file_size_bytes: number | null;
  status: DocumentStatus;
  uploaded_by: string;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface AuditListResult {
  success: boolean;
  documents?: AuditDocument[];
  total?: number;
  page?: number;
  limit?: number;
  status?: 401 | 403 | "error";
  error?: string;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
}

function buildQueryString(query: AuditQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  const str = params.toString();
  return str ? `?${str}` : "";
}

export async function fetchDocumentsAudit(query: AuditQuery = {}): Promise<AuditListResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/audit${buildQueryString(query)}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const data = await response.json();
      return {
        success: true,
        documents: data.documents,
        total: data.total,
        page: data.page,
        limit: data.limit,
      };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading the documents." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

/**
 * Builds the export URL for the current filters. This is meant to be used
 * as a direct navigation / anchor href, not fetched and parsed — the
 * backend returns a raw CSV file with Content-Disposition: attachment, not
 * a JSON API response.
 */
export function getExportUrl(query: Pick<AuditQuery, "search" | "status">): string {
  return `${API_URL}/admin/documents/audit/export${buildQueryString(query)}`;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
