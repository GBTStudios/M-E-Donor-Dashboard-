/**
 * API client for the User Settings feature (notifications + theme).
 * See the User Settings API contract (Racheal, backend) for the full spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Theme = "light" | "dark" | "system";

export interface UserSettings {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  securityAlerts: boolean;
  theme: Theme;
  updatedAt: string;
}

function mapRawSettings(raw: Record<string, unknown>): UserSettings {
  return {
    emailAlerts: Boolean(raw.email_alerts),
    inAppAlerts: Boolean(raw.in_app_alerts),
    securityAlerts: Boolean(raw.security_alerts),
    theme: raw.theme === "dark" || raw.theme === "system" ? raw.theme : "light",
    updatedAt: String(raw.updated_at),
  };
}

export type SettingsResult =
  | { success: true; settings: UserSettings }
  | { success: false; message: string };

export function isSettingsError(
  result: SettingsResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls GET /settings/me — auto-creates defaults on first call, per contract. */
export async function getMySettings(accessToken: string): Promise<SettingsResult> {
  try {
    const response = await fetch(`${API_URL}/settings/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data?.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, settings: mapRawSettings(data) };
    }

    return { success: false, message: data?.detail ?? "Could not load your settings." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface NotificationUpdateFields {
  emailAlerts?: boolean;
  inAppAlerts?: boolean;
  securityAlerts?: boolean;
}

/** Calls PUT /settings/me/notifications with only the fields that changed. */
export async function updateNotificationPreferences(
  accessToken: string,
  fields: NotificationUpdateFields
): Promise<SettingsResult> {
  const body: Record<string, boolean> = {};
  if (fields.emailAlerts !== undefined) body.email_alerts = fields.emailAlerts;
  if (fields.inAppAlerts !== undefined) body.in_app_alerts = fields.inAppAlerts;
  if (fields.securityAlerts !== undefined) body.security_alerts = fields.securityAlerts;

  try {
    const response = await fetch(`${API_URL}/settings/me/notifications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, settings: mapRawSettings(data.settings) };
    }

    if (response.status === 422) {
      return { success: false, message: data.detail ?? "No fields provided to update." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

/** Calls PUT /settings/me/theme. */
export async function updateTheme(accessToken: string, theme: Theme): Promise<SettingsResult> {
  try {
    const response = await fetch(`${API_URL}/settings/me/theme`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ theme }),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, settings: mapRawSettings(data.settings) };
    }

    if (response.status === 422) {
      return { success: false, message: data.detail ?? "Invalid theme value." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}