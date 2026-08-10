/**
 * API client for the Chat Audit Logs feature.
 * See the Chat Audit Logs API contract for the full spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AuditStatus = "all" | "answered" | "declined" | "flagged";

export interface AuditLogItem {
  id: string;
  logNumber: number;
  conversationId: string;
  originatingIdentity: string;
  inquiry: string;
  response: string;
  status: "answered" | "declined" | "flagged";
  resolved: boolean;
  createdAt: string;
  referenceId: string;
}

export interface AuditLogsResult {
  success: true;
  total: number;
  page: number;
  pageSize: number;
  items: AuditLogItem[];
}

export type AuditLogsResponse =
  | AuditLogsResult
  | { success: false; message: string; status: number };

export interface AuditLogsParams {
  search?: string;
  status?: AuditStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(
  accessToken: string,
  params: AuditLogsParams = {}
): Promise<AuditLogsResponse> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.date) query.set("date", params.date);
    else {
      if (params.startDate) query.set("start_date", params.startDate);
      if (params.endDate) query.set("end_date", params.endDate);
    }
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("page_size", String(params.pageSize));

    const response = await fetch(`${API_URL}/admin/audit-logs?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired.", status: 401 };
    }

    if (response.status === 200) {
      const items: AuditLogItem[] = (data.items ?? []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        logNumber: Number(item.log_number),
        conversationId: String(item.conversation_id),
        originatingIdentity: String(item.originating_identity),
        inquiry: String(item.inquiry),
        response: String(item.response),
        status: item.status as "answered" | "declined" | "flagged",
        resolved: Boolean(item.resolved),
        createdAt: String(item.created_at),
        referenceId: String(item.reference_id),
      }));
      return { success: true, total: data.total ?? 0, page: data.page ?? 1, pageSize: data.page_size ?? 20, items };
    }

    return { success: false, message: data.detail ?? "Could not load audit logs.", status: response.status };
  } catch {
    return { success: false, message: "Network error. Please try again.", status: 0 };
  }
}

// ── Conversation Context ──────────────────────────────────────────────────────

export interface ConversationMessage {
  inquiry: string;
  response: string;
  status: string;
  createdAt: string;
}

export interface ConversationContext {
  conversationId: string;
  originatingIdentity: string;
  messages: ConversationMessage[];
}

export type ConversationContextResponse =
  | { success: true; context: ConversationContext }
  | { success: false; message: string };

export async function getConversationContext(
  accessToken: string,
  conversationId: string
): Promise<ConversationContextResponse> {
  try {
    const response = await fetch(`${API_URL}/admin/audit-logs/${conversationId}/context`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired." };
    }

    if (response.status === 200) {
      return {
        success: true,
        context: {
          conversationId: String(data.conversation_id),
          originatingIdentity: String(data.originating_identity),
          messages: (data.messages ?? []).map((m: Record<string, unknown>) => ({
            inquiry: String(m.inquiry),
            response: String(m.response),
            status: String(m.status),
            createdAt: String(m.created_at),
          })),
        },
      };
    }

    return { success: false, message: data.detail ?? "Could not load conversation." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

// ── Resolve Flagged ───────────────────────────────────────────────────────────

export type ResolveResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function resolveAuditLog(
  accessToken: string,
  logId: string
): Promise<ResolveResult> {
  try {
    const response = await fetch(`${API_URL}/admin/audit-logs/${logId}/resolve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired." };
    }

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Marked as resolved." };
    }

    return { success: false, message: data.detail ?? "Could not resolve entry." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

// ── PDF Export ────────────────────────────────────────────────────────────────

export async function exportAuditLogsPdf(
  accessToken: string,
  params: Pick<AuditLogsParams, "search" | "status" | "startDate" | "endDate">
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);

    const response = await fetch(`${API_URL}/admin/audit-logs/export/pdf?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (handleSessionExpiredIfNeeded(response.status, null)) {
      return { success: false, message: "Session expired." };
    }

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `chat-audit-logs-${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }

    return { success: false, message: "Could not export PDF. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}