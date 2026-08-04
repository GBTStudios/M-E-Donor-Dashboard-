/**
 * API client for the staff profile feature. See the Staff Profile
 * Management API contract (Racheal, backend) for the full spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface StaffProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "admin" | "superadmin";
  department: string | null;
  location: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRawProfile(raw: Record<string, unknown>): StaffProfile {
  return {
    id: String(raw.id),
    email: String(raw.email),
    fullName: String(raw.full_name),
    phone: (raw.phone as string | null) ?? null,
    role: raw.role === "superadmin" ? "superadmin" : "admin",
    department: (raw.department as string | null) ?? null,
    location: (raw.location as string | null) ?? null,
    profilePhotoUrl: (raw.profile_photo_url as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export type ProfileResult =
  | { success: true; profile: StaffProfile }
  | { success: false; message: string };

/** Explicit type guard — used instead of relying on `if (!result.success)`
 * control-flow narrowing, which has been unreliable in this project's dev
 * environment. Same runtime check, expressed as a predicate function. */
export function isProfileError(
  result: ProfileResult
): result is { success: false; message: string } {
  return result.success === false;
}

/** Calls GET /profile/me — the currently authenticated user's own profile. */
export async function getMyProfile(accessToken: string): Promise<ProfileResult> {
  try {
    const response = await fetch(`${API_URL}/profile/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawProfile(data) };
    }

    return { success: false, message: data.detail ?? "Could not load your profile." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

export interface ProfileUpdateFields {
  fullName?: string;
  phone?: string;
  department?: string;
  location?: string;
  bio?: string;
}

/**
 * Calls PUT /profile/me with only the fields that changed. `role` and
 * `email` are never sent — the backend ignores them anyway, but there's no
 * reason to include fields this endpoint can't change.
 */
export async function updateMyProfile(
  accessToken: string,
  fields: ProfileUpdateFields
): Promise<ProfileResult> {
  const body: Record<string, string> = {};
  if (fields.fullName !== undefined) body.full_name = fields.fullName;
  if (fields.phone !== undefined) body.phone = fields.phone;
  if (fields.department !== undefined) body.department = fields.department;
  if (fields.location !== undefined) body.location = fields.location;
  if (fields.bio !== undefined) body.bio = fields.bio;

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
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawProfile(data.profile) };
    }

    if (response.status === 422) {
      return { success: false, message: data.detail ?? "No fields provided to update." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

/** Calls PUT /profile/me/photo with a real file (multipart/form-data). */
export async function updateProfilePhoto(
  accessToken: string,
  file: File
): Promise<ProfileResult> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${API_URL}/profile/me/photo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      // No Content-Type header — the browser sets the correct multipart
      // boundary automatically when the body is a FormData instance.
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, profile: mapRawProfile(data.profile) };
    }

    if (response.status === 422) {
      return {
        success: false,
        message: data.detail ?? "Image must be JPEG, PNG, or WEBP, under 5MB.",
      };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}