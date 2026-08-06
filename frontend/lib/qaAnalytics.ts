import { getAuthHeaders } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface QASummary {
  questions_today: number;
  answered: number;
  declined: number;
  flagged: number;
}

export interface TrendPoint {
  date: string;
  answered: number;
  declined: number;
  flagged: number;
}

export interface TrendData {
  period: "daily" | "weekly" | "monthly";
  data: TrendPoint[];
}

export type ModerationStatus = "pending" | "resolved" | "false_positive" | "escalated";

export interface FlaggedItem {
  id: string;
  question: string;
  response: string;
  flag_reason: string;
  donor_name: string;
  created_at: string;
  moderation_status: ModerationStatus;
}

export interface ModeratorNote {
  id: string;
  moderator_name: string;
  note: string;
  created_at: string;
}

export interface FlaggedDetail extends FlaggedItem {
  moderator_notes: ModeratorNote[];
}

export interface QAResult {
  success: boolean;
  summary?: QASummary;
  trends?: TrendData;
  items?: FlaggedItem[];
  total?: number;
  page?: number;
  limit?: number;
  detail?: FlaggedDetail;
  status?: 401 | 403 | 404 | "error";
  error?: string;
}

export async function fetchQASummary(): Promise<QAResult> {
  try {
    const response = await fetch(`${API_URL}/admin/qa-analytics/summary`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const summary = await response.json();
      return { success: true, summary };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading the summary." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchQATrends(
  period: "daily" | "weekly" | "monthly",
  start?: string,
  end?: string
): Promise<QAResult> {
  try {
    const params = new URLSearchParams({ period });
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const response = await fetch(`${API_URL}/admin/qa-analytics/trends?${params.toString()}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const trends = await response.json();
      return { success: true, trends };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading trends." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export interface FlaggedQuery {
  status?: ModerationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchFlaggedConversations(query: FlaggedQuery = {}): Promise<QAResult> {
  try {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("search", query.search);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const response = await fetch(`${API_URL}/admin/qa-analytics/flagged?${params.toString()}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const data = await response.json();
      return { success: true, items: data.items, total: data.total, page: data.page, limit: data.limit };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to this page." };
    }

    return { success: false, status: "error", error: "Something went wrong loading flagged conversations." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function fetchFlaggedDetail(id: string): Promise<QAResult> {
  try {
    const response = await fetch(`${API_URL}/admin/qa-analytics/flagged/${id}`, {
      headers: { ...getAuthHeaders() },
    });

    if (response.status === 200) {
      const detail = await response.json();
      return { success: true, detail };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to view this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This conversation no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong loading this conversation." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function updateModerationStatus(
  id: string,
  moderationStatus: ModerationStatus
): Promise<QAResult> {
  try {
    const response = await fetch(`${API_URL}/admin/qa-analytics/flagged/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ moderation_status: moderationStatus }),
    });

    if (response.status === 200) {
      const detail = await response.json();
      return { success: true, detail };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This conversation no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong updating the status." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}

export async function addModeratorNote(id: string, note: string): Promise<QAResult> {
  try {
    const response = await fetch(`${API_URL}/admin/qa-analytics/flagged/${id}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ note }),
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true };
    }

    if (response.status === 401) {
      return { success: false, status: 401, error: "Your session has expired. Please log in again." };
    }
    if (response.status === 403) {
      return { success: false, status: 403, error: "You do not have admin access to do this." };
    }
    if (response.status === 404) {
      return { success: false, status: 404, error: "This conversation no longer exists." };
    }

    return { success: false, status: "error", error: "Something went wrong adding your note." };
  } catch {
    return { success: false, status: "error", error: "Network error. Please try again." };
  }
}
