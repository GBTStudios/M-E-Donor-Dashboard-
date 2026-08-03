/**
 * API client and local state helpers for the admin/superadmin first-login
 * forced password setup flow. See the Admin Onboarding & Access Security
 * API contract (Douglas, backend) for the full endpoint spec.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { handleSessionExpiredIfNeeded } from "@/lib/sessionTimeout";

const FIRST_LOGIN_KEY = "first_login";

/**
 * Stores the first_login flag from a login response. Called right after a
 * successful /auth/login, alongside storing the access_token.
 */
export function setFirstLoginFlag(value: boolean): void {
  localStorage.setItem(FIRST_LOGIN_KEY, String(value));
}

/**
 * Reads the stored first_login flag. Used by route guards on every
 * protected-page mount — not just once at login — so direct URL entry and
 * back-button navigation are both covered, per the API contract's frontend
 * rule.
 */
export function getFirstLoginFlag(): boolean {
  return localStorage.getItem(FIRST_LOGIN_KEY) === "true";
}

/** Called after successfully setting the first password. */
export function clearFirstLoginFlag(): void {
  localStorage.removeItem(FIRST_LOGIN_KEY);
}

const ROLE_KEY = "role";

export type UserRole = "superadmin" | "admin" | "donor";

/** Stores the account's role from a login response. */
export function setRole(role: UserRole): void {
  localStorage.setItem(ROLE_KEY, role);
}

/**
 * Reads the stored role. Used to decide whether to show superadmin-only UI
 * (e.g. the "Add Admin" section) — regular admins and donors never see it.
 */
export function getRole(): UserRole | null {
  const value = localStorage.getItem(ROLE_KEY);
  if (value === "superadmin" || value === "admin" || value === "donor") return value;
  return null;
}

export function isSuperadmin(): boolean {
  return getRole() === "superadmin";
}

export interface CreateAdminResult {
  success: boolean;
  message: string;
  /** Present on success — the superadmin must share this with the new admin out-of-band. */
  temporaryPassword?: string;
}

/**
 * Calls POST /admin/create-user (superadmin only). Creates a new account
 * with role: admin and first_login: true on the backend.
 */
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
      return { success: false, message: "Session expired due to inactivity. Please log in again." };
    }

    if (response.status === 201) {
      return {
        success: true,
        message: data.message ?? "Admin account created.",
        temporaryPassword: data.temporary_password,
      };
    }

    if (response.status === 403) {
      return { success: false, message: data.detail ?? "Superadmin access required." };
    }

    if (response.status === 409) {
      return { success: false, message: data.detail ?? "An account with this email already exists." };
    }

    return { success: false, message: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, message: "Network error. Please try again." };
  }
}

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

/**
 * Calls GET /admin/users (superadmin only) — the real list of every
 * admin/superadmin account. Field-name fallbacks (is_active/active,
 * full_name/name) are handled defensively since the exact response shape
 * hasn't been independently confirmed against Swagger's schema yet; if the
 * real field names differ from what's checked here, this will need a
 * follow-up adjustment once actually tested against the live response.
 */
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

export interface AccountStatusChangeResult {
  success: boolean;
  message: string;
}

/** Calls POST /admin/deactivate-user (superadmin only). */
export async function deactivateUser(
  accessToken: string,
  userId: string
): Promise<AccountStatusChangeResult> {
  return changeAccountStatus(accessToken, userId, "deactivate-user");
}

/** Calls POST /admin/reactivate-user (superadmin only). */
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

export interface SetFirstPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Calls POST /auth/set-first-password with the given new password, using
 * the Bearer token from the account's first (temporary-password) login.
 *
 * Never throws for documented failure cases (400 weak password, 401
 * invalid/expired token) — those come back as { success: false, message }.
 */
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