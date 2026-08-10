import { supabase } from "@/lib/supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type LoginResult =
  | { success: true; user: { id: string; email: string; full_name: string; role: string } }
  | { success: false; error: string };

export async function loginUser(
  email: string,
  password: string,
  keepSignedIn: boolean
): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, keepSignedIn }),
    });

    if (response.status === 200) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      return { success: true, user: data.user };
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { success: false, error: data.detail ?? "Invalid email or password" };
    }

    if (response.status === 422) {
      return { success: false, error: "Please check your email and password format." };
    }

    if (response.status === 429) {
      return { success: false, error: data.detail ?? "Too many attempts. Please wait and try again." };
    }

    return { success: false, error: data.detail ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logoutUser() {
  localStorage.removeItem("access_token");
}

type RequestResetResult =
  | { success: true }
  | { success: false; error: string };

export async function requestResetCode(email: string): Promise<RequestResetResult> {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (response.status === 200) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.detail ?? data.error ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

type VerifyCodeResult =
  | { success: true }
  | { success: false; error: string; expired?: boolean };

export async function verifyResetCode(email: string, code: string): Promise<VerifyCodeResult> {
  try {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (response.status === 200) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 410) {
      return { success: false, error: "This code has expired. Please request a new one.", expired: true };
    }

    return { success: false, error: data.detail ?? data.error ?? "Invalid code. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });

    if (response.status === 200) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.detail ?? data.error ?? "Something went wrong. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/google-callback`,
    },
  });

  if (error) {
    console.error("Google sign in error:", error.message);
  }
}

type GoogleLoginResult =
  | { success: true; user: { id: string; email: string; full_name: string; role: string } }
  | { success: false; error: string };

export async function completeGoogleLogin(): Promise<GoogleLoginResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const supabaseToken = sessionData.session?.access_token;

  if (!supabaseToken) {
    return { success: false, error: "Google sign in did not complete. Please try again." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/google-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: supabaseToken }),
    });

    if (response.status === 200) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      return {
        success: true,
        user: { id: data.id, email: data.email, full_name: data.full_name, role: data.role },
      };
    }

    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.detail ?? "Google sign in failed. Please try again." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}