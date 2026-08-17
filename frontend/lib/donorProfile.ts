/**
 * API client for the donor profile feature. Same GET/PUT /profile/me
 * endpoints staff uses (lib/profile.ts), but the donor JSON shape omits
 * department/title/phone/location entirely and includes `company` instead.
 * See the Donor Profile & Settings API contract (Racheal, backend).
 */

import i18n from "@/lib/i18n";
import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DonorProfile {
  id: string;
  email: string;
  fullName: string;
  role: "donor";
  company: string | null;
  profilePhotoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapRawDonorProfile(raw: Record<string, unknown>): DonorProfile {
  return {
    id: String(raw.id),
    email: String(raw.email),
    fullName: String(raw.full_name),
    role: "donor",
    company: (raw.company as string | null) ?? null,
    profilePhotoUrl: (raw.profile_photo_url as string | null) ?? null,
    isActive: Boolean(raw.is_active),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export type DonorProfileResult =
  | { success: true; profile: DonorProfile }
  | { success: false; message: string };

export function isDonorProfileError(
  result: DonorProfileResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls GET /profile/me — same endpoint staff uses; response is donor-shaped
 * when the logged-in user's role is "donor". */
export async function getMyDonorProfile(accessToken: string): Promise<DonorProfileResult> {
  try {
    const response = await fetch(`${API_URL}/profile/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: i18n.t("errors.sessionExpired", { ns: "donor" }) };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawDonorProfile(data) };
    }

    return { success: false, message: data.detail ?? i18n.t("errors.profile.couldNotLoad", { ns: "donor" }) };
  } catch {
    return { success: false, message: i18n.t("errors.networkError", { ns: "donor" }) };
  }
}

export interface DonorProfileUpdateFields {
  fullName?: string;
  company?: string;
}

/**
 * Calls PUT /profile/me with only the fields that changed. `role`, `id`,
 * `email`, `is_active` are protected server-side and never sent here.
 */
export async function updateMyDonorProfile(
  accessToken: string,
  fields: DonorProfileUpdateFields
): Promise<DonorProfileResult> {
  const body: Record<string, string> = {};
  if (fields.fullName !== undefined) body.full_name = fields.fullName;
  if (fields.company !== undefined) body.company = fields.company;

  try {
    const response = await fetch(`${API_URL}/profile/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: i18n.t("errors.sessionExpired", { ns: "donor" }) };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawDonorProfile(data.profile ?? data) };
    }

    if (response.status === 422) {
      return { success: false, message: data.detail ?? i18n.t("errors.profile.noFieldsToUpdate", { ns: "donor" }) };
    }

    return { success: false, message: data.detail ?? i18n.t("errors.profile.somethingWentWrong", { ns: "donor" }) };
  } catch {
    return { success: false, message: i18n.t("errors.networkError", { ns: "donor" }) };
  }
}

/**
 * Calls PUT /profile/me/photo — same multipart endpoint the staff profile
 * page uses. NOT explicitly covered by the donor contract text; if it 404s
 * for a donor account, drop the camera button from DonorProfileCard until
 * backend confirms it's shared.
 */
export async function updateDonorProfilePhoto(
  accessToken: string,
  file: File
): Promise<DonorProfileResult> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${API_URL}/profile/me/photo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: i18n.t("errors.sessionExpired", { ns: "donor" }) };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawDonorProfile(data.profile ?? data) };
    }

    if (response.status === 422) {
      return {
        success: false,
        message: data.detail ?? i18n.t("errors.profile.photoInvalid", { ns: "donor" }),
      };
    }

    return { success: false, message: data.detail ?? i18n.t("errors.profile.somethingWentWrong", { ns: "donor" }) };
  } catch {
    return { success: false, message: i18n.t("errors.networkError", { ns: "donor" }) };
  }
}
