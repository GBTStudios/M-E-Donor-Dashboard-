import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type DocumentStatus = "processing" | "pending" | "published" | "excluded";

export interface DocumentListItem {
  id: string;
  filename: string;
  file_type: string;
  status: DocumentStatus;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DocumentDetail extends DocumentListItem {
  file_url: string;
  raw_text: string | null;
  ai_summary: string | null;
  final_content: string | null;
}

export interface DocumentResult {
  success: boolean;
  document?: DocumentDetail;
  documents?: DocumentListItem[];
  status?: 401 | 403 | 404 | 409 | 422 | "error";
  error?: string;
}

/**
 * Uploads a document. Returns immediately per the contract (202 Accepted) —
 * parsing and AI summarization happen in the background. The returned
 * document will have status "processing"; poll fetchDocumentDetail to know
 * when it moves to "pending".
 */
export async function uploadDocument(file: File): Promise<DocumentResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/admin/documents`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });

    if (response.status === 202) {
      const document = await response.json();
      return { success: true, document };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 422) {
      return {
        success: false,
        status: 422,
        error: "Please upload a PDF, Word, Excel, or CSV file under 25MB.",
      };
    }

    return { success: false, status: "error", error: "Something went wrong uploading the file." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchDocuments(status?: DocumentStatus): Promise<DocumentResult> {
  try {
    const query = status ? `?status=${status}` : "";
    const response = await fetch(`${API_URL}/admin/documents${query}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const documents = await response.json();
      return { success: true, documents };
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

export async function fetchDocumentDetail(id: string): Promise<DocumentResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/${id}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const document = await response.json();
      return { success: true, document };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to view this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This document no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong loading the document." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

/** "Save Edit" — updates final_content only, does not change status. */
export async function saveDocumentEdit(id: string, finalContent: string): Promise<DocumentResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ final_content: finalContent }),
    });

    if (response.status === 200) {
      const document = await response.json();
      return { success: true, document };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This document no longer exists." };
    }

    if (response.status === 422) {
      return { success: false, status: 422, error: "Content cannot be empty." };
    }

    return { success: false, status: "error", error: "Something went wrong saving your edit." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

/** "Approve & Publish" — only works when status is currently "pending". */
export async function publishDocument(id: string): Promise<DocumentResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/${id}/publish`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const document = await response.json();
      return { success: true, document };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This document no longer exists." };
    }

    if (response.status === 409) {
      return {
        success: false,
        status: 409,
        error: "This document can't be published right now (it may already be published, excluded, or still processing).",
      };
    }

    return { success: false, status: "error", error: "Something went wrong publishing this document." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function excludeDocument(id: string): Promise<DocumentResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/${id}/exclude`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const document = await response.json();
      return { success: true, document };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }

    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }

    if (response.status === 404) {
      return { success: false, status: 404, error: "This document no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong excluding this document." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

/** Fully removes the document and its file. Permanent, unlike exclude. */
export async function deleteDocument(id: string): Promise<DocumentResult> {
  try {
    const response = await fetch(`${API_URL}/admin/documents/${id}`, {
      method: "DELETE",
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
      return { success: false, status: 404, error: "This document no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong deleting this document." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}
