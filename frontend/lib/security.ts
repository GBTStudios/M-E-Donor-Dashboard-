/**
 * API client for password change and connected-devices session management.
 * See the Password Management & Connected Devices API contract (Racheal,
 * backend) for the full spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type SimpleResult =
  | { success: true; message: string }
  | { success: false; message: string };

/** Explicit type guard — see lib/api.ts / lib/profile.ts for why this
 * pattern is used instead of `if (!result.success)` inline narrowing. */
export function isSimpleError(
  result: SimpleResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls POST /auth/change-password. */
export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<SimpleResult> {
  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Password changed successfully." };
    }

    if (response.status === 401) {
      return { success: false, message: data.detail ?? "Current password is incorrect." };
    }

    if (response.status === 400) {
      return { success: false, message: data.detail ?? "Please check your new password." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface DeviceSession {
  id: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export type SessionsListResult =
  | { success: true; sessions: DeviceSession[] }
  | { success: false; message: string };

export function isSessionsListError(
  result: SessionsListResult
): result is { success: false; message: string } {
  return result.success === false;
}

function mapRawSession(raw: Record<string, unknown>): DeviceSession {
  return {
    id: String(raw.id),
    browser: String(raw.browser ?? "Unknown browser"),
    os: String(raw.os ?? "Unknown OS"),
    ipAddress: String(raw.ip_address ?? ""),
    location: (raw.location as string | null) ?? null,
    createdAt: String(raw.created_at),
    lastActiveAt: String(raw.last_active_at),
    isCurrent: Boolean(raw.is_current),
  };
}

/** Calls GET /auth/sessions — every active session for the logged-in user. */
export async function getSessions(accessToken: string): Promise<SessionsListResult> {
  try {
    const response = await fetch(`${API_URL}/auth/sessions`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data?.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      const rawList: unknown[] = Array.isArray(data) ? data : [];
      return { success: true, sessions: rawList.map((r) => mapRawSession(r as Record<string, unknown>)) };
    }

    return { success: false, message: data?.detail ?? "Could not load your devices." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

/** Calls DELETE /auth/sessions/{session_id} — signs out one specific device. */
export async function revokeSession(accessToken: string, sessionId: string): Promise<SimpleResult> {
  try {
    const response = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Device signed out." };
    }

    if (response.status === 404) {
      return { success: false, message: data.detail ?? "Session not found." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export type RevokeOthersResult =
  | { success: true; message: string; revokedCount: number }
  | { success: false; message: string };

export function isRevokeOthersError(
  result: RevokeOthersResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls POST /auth/sessions/revoke-others — signs out every OTHER device. */
export async function revokeOtherSessions(accessToken: string): Promise<RevokeOthersResult> {
  try {
    const response = await fetch(`${API_URL}/auth/sessions/revoke-others`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return {
        success: true,
        message: data.message ?? "Signed out of other devices.",
        revokedCount: Number(data.revoked_count ?? 0),
      };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}