/**
 * API client for donor settings (notifications + regional preferences).
 * Same GET/PUT pattern as lib/userSettings.ts (staff), but the donor JSON
 * shape has notification toggles instead of theme, plus language/timezone.
 * See the Donor Profile & Settings API contract (Racheal, backend).
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DonorSettings {
  quarterlyReportReady: boolean;
  newCohortMilestones: boolean;
  answerCorrections: boolean;
  language: string;
  timezone: string;
  updatedAt: string;
}

function mapRawDonorSettings(raw: Record<string, unknown>): DonorSettings {
  return {
    quarterlyReportReady: Boolean(raw.quarterly_report_ready),
    newCohortMilestones: Boolean(raw.new_cohort_milestones),
    answerCorrections: Boolean(raw.answer_corrections),
    language: String(raw.language ?? "English"),
    timezone: String(raw.timezone ?? ""),
    updatedAt: String(raw.updated_at),
  };
}

export type DonorSettingsResult =
  | { success: true; settings: DonorSettings }
  | { success: false; message: string };

export function isDonorSettingsError(
  result: DonorSettingsResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls GET /settings/me — auto-creates defaults on first call, per contract. */
export async function getMyDonorSettings(accessToken: string): Promise<DonorSettingsResult> {
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
      return { success: true, settings: mapRawDonorSettings(data) };
    }

    return { success: false, message: data?.detail ?? "Could not load your settings." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface DonorNotificationUpdateFields {
  quarterlyReportReady?: boolean;
  newCohortMilestones?: boolean;
  answerCorrections?: boolean;
}

/** Calls PUT /settings/me/notifications with only the fields that changed. */
export async function updateDonorNotificationPreferences(
  accessToken: string,
  fields: DonorNotificationUpdateFields
): Promise<DonorSettingsResult> {
  const body: Record<string, boolean> = {};
  if (fields.quarterlyReportReady !== undefined) body.quarterly_report_ready = fields.quarterlyReportReady;
  if (fields.newCohortMilestones !== undefined) body.new_cohort_milestones = fields.newCohortMilestones;
  if (fields.answerCorrections !== undefined) body.answer_corrections = fields.answerCorrections;

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
      return { success: true, settings: mapRawDonorSettings(data.settings ?? data) };
    }

    if (response.status === 422) {
      return { success: false, message: data.detail ?? "No fields provided to update." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface DonorRegionalUpdateFields {
  language?: string;
  timezone?: string;
}

/**
 * Calls PUT /settings/me/regional. `language` is server-validated to exactly
 * "English" or "German" — a 422 comes back as
 * `{ detail: [{ loc, msg, ... }] }`; we surface `detail[0].msg` when present.
 */
export async function updateDonorRegionalPreferences(
  accessToken: string,
  fields: DonorRegionalUpdateFields
): Promise<DonorSettingsResult> {
  const body: Record<string, string> = {};
  if (fields.language !== undefined) body.language = fields.language;
  if (fields.timezone !== undefined) body.timezone = fields.timezone;

  try {
    const response = await fetch(`${API_URL}/settings/me/regional`, {
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
      return { success: true, settings: mapRawDonorSettings(data.settings ?? data) };
    }

    if (response.status === 422) {
      const detail = data.detail;
      const message =
        Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : typeof detail === "string"
          ? detail
          : "Please choose a supported language.";
      return { success: false, message };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export type SettingsOptionsResult =
  | { success: true; languages: string[] }
  | { success: false; message: string };

export function isSettingsOptionsError(
  result: SettingsOptionsResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls GET /settings/options — no auth required. Populates the language
 * dropdown so the frontend never hardcodes the supported list. */
export async function getSettingsOptions(): Promise<SettingsOptionsResult> {
  try {
    const response = await fetch(`${API_URL}/settings/options`, { method: "GET" });
    const data = await response.json().catch(() => ({}));

    if (response.status === 200) {
      const languages = Array.isArray(data.languages) ? data.languages.map(String) : ["English"];
      return { success: true, languages };
    }

    return { success: false, message: data?.detail ?? "Could not load language options." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}