/**
 * API client and local state helpers for the admin/superadmin first-login
 * forced password setup flow. See the Admin Onboarding & Access Security
 * API contract (Douglas, backend) for the full endpoint spec.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  /** Present on success — used to add this account to the local tracked list. */
  createdAccount?: TrackedAdminAccount;
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

    if (response.status === 201) {
      const createdAccount: TrackedAdminAccount = {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role === "superadmin" ? "superadmin" : "admin",
        isActive: true,
      };
      addTrackedAdminAccount(createdAccount);
      return {
        success: true,
        message: data.message ?? "Admin account created.",
        temporaryPassword: data.temporary_password,
        createdAccount,
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

const TRACKED_ADMIN_ACCOUNTS_KEY = "tracked_admin_accounts";

export interface TrackedAdminAccount {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "superadmin";
  isActive: boolean;
}

/**
 * STOPGAP, NOT A REAL BACKEND LIST — there is currently no GET /admin/users
 * (or similar) endpoint to fetch the real set of admin accounts from the
 * database. Until that exists, this tracks accounts created through this
 * exact browser via createAdminUser(), stored in localStorage, so the
 * "Manage Accounts" list reflects real accounts instead of hardcoded fake
 * ones. Limitations: only shows accounts created from this browser going
 * forward; won't show the seeded superadmin or accounts created elsewhere.
 * Replace this entirely once a real list endpoint exists.
 */
export function getTrackedAdminAccounts(): TrackedAdminAccount[] {
  try {
    const raw = localStorage.getItem(TRACKED_ADMIN_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addTrackedAdminAccount(account: TrackedAdminAccount): void {
  const current = getTrackedAdminAccounts();
  localStorage.setItem(TRACKED_ADMIN_ACCOUNTS_KEY, JSON.stringify([...current, account]));
}

export function setTrackedAdminAccountActive(id: string, isActive: boolean): void {
  const current = getTrackedAdminAccounts();
  const updated = current.map((a) => (a.id === id ? { ...a, isActive } : a));
  localStorage.setItem(TRACKED_ADMIN_ACCOUNTS_KEY, JSON.stringify(updated));
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
  const result = await changeAccountStatus(accessToken, userId, "deactivate-user");
  if (result.success) setTrackedAdminAccountActive(userId, false);
  return result;
}

/** Calls POST /admin/reactivate-user (superadmin only). */
export async function reactivateUser(
  accessToken: string,
  userId: string
): Promise<AccountStatusChangeResult> {
  const result = await changeAccountStatus(accessToken, userId, "reactivate-user");
  if (result.success) setTrackedAdminAccountActive(userId, true);
  return result;
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