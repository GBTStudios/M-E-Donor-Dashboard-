/**
 * API client for the Admin Dashboard feature.
 * See the Admin Dashboard API contract for the full spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Stats ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  documentsUploaded: number;
  pendingReview: number;
  published: number;
  activeUsers: number;
  questionsToday: number | null;
  answered: number | null;
  declined: number | null;
  flagged: number | null;
  vectorDbConnectivityPct: number | null;
  queryLatencyMs: number | null;
  conversationsReady: boolean;
}

export type DashboardStatsResult =
  | { success: true; stats: DashboardStats }
  | { success: false; message: string; status: number };

export async function getDashboardStats(accessToken: string): Promise<DashboardStatsResult> {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired.", status: 401 };
    }

    if (response.status === 200) {
      return {
        success: true,
        stats: {
          documentsUploaded: data.documents_uploaded ?? 0,
          pendingReview: data.pending_review ?? 0,
          published: data.published ?? 0,
          activeUsers: data.active_users ?? 0,
          questionsToday: data.questions_today ?? null,
          answered: data.answered ?? null,
          declined: data.declined ?? null,
          flagged: data.flagged ?? null,
          vectorDbConnectivityPct: data.vector_db_connectivity_pct ?? null,
          queryLatencyMs: data.query_latency_ms ?? null,
          conversationsReady: data.conversations_ready ?? false,
        },
      };
    }

    return {
      success: false,
      message: data.detail ?? "Could not load stats.",
      status: response.status,
    };
  } catch {
    return { success: false, message: "Network error. Please try again.", status: 0 };
  }
}

// ── Needs Your Attention ─────────────────────────────────────────────────────

export interface AttentionItem {
  id: string;
  filename: string;
  status: string;
  uploadedByName: string | null;
  createdAt: string;
}

export type NeedsAttentionResult =
  | { success: true; count: number; items: AttentionItem[] }
  | { success: false; message: string; status: number };

export async function getNeedsAttention(accessToken: string): Promise<NeedsAttentionResult> {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard/needs-attention`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired.", status: 401 };
    }

    if (response.status === 200) {
      const items: AttentionItem[] = (data.items ?? []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        filename: String(item.filename),
        status: String(item.status),
        uploadedByName: (item.uploaded_by_name as string | null) ?? null,
        createdAt: String(item.created_at),
      }));
      return { success: true, count: data.count ?? items.length, items };
    }

    return {
      success: false,
      message: data.detail ?? "Could not load attention items.",
      status: response.status,
    };
  } catch {
    return { success: false, message: "Network error. Please try again.", status: 0 };
  }
}

// ── System Health ─────────────────────────────────────────────────────────────

export interface SystemHealth {
  apiStatus: string;
  databaseStatus: string;
  databaseLatencyMs: number;
}

export type SystemHealthResult =
  | { success: true; health: SystemHealth }
  | { success: false; message: string; status: number };

export async function getSystemHealth(accessToken: string): Promise<SystemHealthResult> {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard/health`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired.", status: 401 };
    }

    if (response.status === 200) {
      return {
        success: true,
        health: {
          apiStatus: data.api_status ?? "unknown",
          databaseStatus: data.database_status ?? "unknown",
          databaseLatencyMs: data.database_latency_ms ?? 0,
        },
      };
    }

    return {
      success: false,
      message: data.detail ?? "Could not load health data.",
      status: response.status,
    };
  } catch {
    return { success: false, message: "Network error. Please try again.", status: 0 };
  }
}