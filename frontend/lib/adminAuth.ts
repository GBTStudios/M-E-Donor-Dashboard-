/**
 * API client and local state helpers for the admin/superadmin first-login
 * forced password setup flow. See the Admin Onboarding & Access Security
 * API contract (Douglas, backend) for the full endpoint spec.
 */

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FIRST_LOGIN_KEY = "first_login";

export function setFirstLoginFlag(value: boolean): void {
  localStorage.setItem(FIRST_LOGIN_KEY, String(value));
}

export function getFirstLoginFlag(): boolean {
  return localStorage.getItem(FIRST_LOGIN_KEY) === "true";
}

export function clearFirstLoginFlag(): void {
  localStorage.removeItem(FIRST_LOGIN_KEY);
}

const ROLE_KEY = "role";

export type UserRole = "superadmin" | "admin" | "donor";

export function setRole(role: UserRole): void {
  localStorage.setItem(ROLE_KEY, role);
}

export function getRole(): UserRole | null {
  const value = localStorage.getItem(ROLE_KEY);
  if (value === "superadmin" || value === "admin" || value === "donor") return value;
  return null;
}

export function isSuperadmin(): boolean {
  return getRole() === "superadmin";
}

// ── Create Admin ──────────────────────────────────────────────────────────────

/**
 * See "M&E Donor Dashboard Admin Welcome Email — API Contract" (Recho, backend).
 * The backend now emails the new admin their login details automatically.
 * emailSent tells the UI which message to show:
 *  - true  → welcome email was sent; temporaryPassword is null, don't show it
 *  - false → email failed to send; temporaryPassword is populated as a
 *            manual fallback so the superadmin can relay it themselves
 */
export interface CreateAdminResult {
  success: boolean;
  message: string;
  email?: string;
  emailSent?: boolean;
  temporaryPassword: string | null;
}

export async function createAdminUser(
  accessToken: string,
  email: string,
  fullName: string
): Promise<CreateAdminResult> {
  try {
    const response = await fetch(`${API_URL}/admin/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email, full_name: fullName }),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return {
        success: false,
        message: "Session expired due to inactivity. Please log in again.",
        temporaryPassword: null,
      };
    }

    if (response.status === 201) {
      return {
        success: true,
        message: data.message ?? "Admin account created.",
        email: data.email ?? email,
        emailSent: Boolean(data.email_sent),
        temporaryPassword: data.temporary_password ?? null,
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        message: data.detail ?? "Superadmin access required.",
        temporaryPassword: null,
      };
    }

    if (response.status === 409) {
      return {
        success: false,
        message: data.detail ?? "An account with this email already exists.",
        temporaryPassword: null,
      };
    }

    return {
      success: false,
      message: data.detail ?? "Something went wrong. Please try again.",
      temporaryPassword: null,
    };
  } catch {
    return {
      success: false,
      message: "Network error. Please try again.",
      temporaryPassword: null,
    };
  }
}

// ── List Admins ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "superadmin";
  isActive: boolean;
}

export type AdminUsersListResult =
  | { success: true; users: AdminUser[] }
  | { success: false; message: string };

export async function getAdminUsersList(accessToken: string): Promise<AdminUsersListResult> {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      const rawList: unknown[] = Array.isArray(data) ? data : (data.users ?? []);
      const users: AdminUser[] = rawList.map((raw) => {
        const r = raw as Record<string, unknown>;
        return {
          id: String(r.id),
          email: String(r.email),
          fullName: String(r.full_name ?? r.fullName ?? r.name ?? ""),
          role: r.role === "superadmin" ? "superadmin" : "admin",
          isActive: Boolean(r.is_active ?? r.isActive ?? r.active ?? true),
        };
      });
      return { success: true, users };
    }

    if (response.status === 403) {
      return { success: false, message: data.detail ?? "Superadmin access required." };
    }

    return { success: false, message: data.detail ?? "Could not load admin accounts." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

// ── Activate / Deactivate ─────────────────────────────────────────────────────

export interface AccountStatusChangeResult {
  success: boolean;
  message: string;
}

export async function deactivateUser(
  accessToken: string,
  userId: string
): Promise<AccountStatusChangeResult> {
  return changeAccountStatus(accessToken, userId, "deactivate-user");
}

export async function reactivateUser(
  accessToken: string,
  userId: string
): Promise<AccountStatusChangeResult> {
  return changeAccountStatus(accessToken, userId, "reactivate-user");
}

async function changeAccountStatus(
  accessToken: string,
  userId: string,
  endpoint: "deactivate-user" | "reactivate-user"
): Promise<AccountStatusChangeResult> {
  try {
    const response = await fetch(`${API_URL}/admin/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Done." };
    }

    if (response.status === 403) {
      return { success: false, message: data.detail ?? "Superadmin access required." };
    }

    if (response.status === 404) {
      return { success: false, message: data.detail ?? "User not found." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

// ── Delete Admin ──────────────────────────────────────────────────────────────

export interface DeleteUserResult {
  success: boolean;
  message: string;
}

/** Calls POST /admin/delete-user (superadmin only). Permanently deletes an admin account. */
export async function deleteAdminUser(
  accessToken: string,
  userId: string
): Promise<DeleteUserResult> {
  try {
    const response = await fetch(`${API_URL}/admin/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json().catch(() => ({}));

    if (handleSessionExpiredIfNeeded(response.status, data.detail)) {
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Account permanently deleted." };
    }

    if (response.status === 400) {
      return { success: false, message: data.detail ?? "Cannot delete this account." };
    }

    if (response.status === 403) {
      return { success: false, message: data.detail ?? "Superadmin access required." };
    }

    if (response.status === 404) {
      return { success: false, message: data.detail ?? "User not found." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

// ── Set First Password ────────────────────────────────────────────────────────

export interface SetFirstPasswordResult {
  success: boolean;
  message: string;
}

export async function setFirstPassword(
  accessToken: string,
  newPassword: string
): Promise<SetFirstPasswordResult> {
  try {
    const response = await fetch(`${API_URL}/auth/set-first-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 200) {
      return { success: true, message: data.message ?? "Password set successfully." };
    }

    if (response.status === 400) {
      return {
        success: false,
        message:
          data.detail ??
          "Password must be at least 6 characters, include one number, and one special symbol.",
      };
    }

    if (response.status === 401) {
      return { success: false, message: data.detail ?? "Invalid or expired token. Please log in again." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}