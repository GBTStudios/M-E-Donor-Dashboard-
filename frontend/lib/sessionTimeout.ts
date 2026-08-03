"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/** Matches the backend's exact message for an inactivity-timeout 401, per
 * the API contract — distinct from "Invalid or expired token." Checking
 * this exact string (rather than just any 401) is what lets us show the
 * dedicated Session Expired screen instead of a generic login error. */
const INACTIVITY_TIMEOUT_MESSAGE = "Session expired due to inactivity. Please log in again.";

const WARNING_MS = 25 * 60 * 1000;
const TIMEOUT_MS = 30 * 60 * 1000;

/** Clears all stored session state — same effect as a manual logout. */
function clearSessionState(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("first_login");
  localStorage.removeItem("role");
}

function redirectToSessionExpired(): void {
  clearSessionState();
  window.location.href = "/session-expired";
}

/**
 * Call this after any authenticated API response, from any lib/*.ts fetch
 * wrapper — plain function, not a hook, since it needs to run from inside
 * fetch calls that live outside the React tree (lib/adminAuth.ts, etc.).
 *
 * Per the contract: "any API call could come back with the inactivity
 * message... treat this the same as the client-side timeout" — this is
 * that backstop, independent of whether the frontend's own timer has
 * fired yet.
 *
 * Returns true if this response WAS a session-timeout 401 (and has already
 * redirected) — callers should stop further processing of the response
 * when this returns true.
 */
export function handleSessionExpiredIfNeeded(status: number, detail: unknown): boolean {
  if (status === 401 && detail === INACTIVITY_TIMEOUT_MESSAGE) {
    redirectToSessionExpired();
    return true;
  }
  return false;
}

export interface InactivityTimerState {
  /** True during the 25–30 minute warning window. */
  showWarning: boolean;
}

/**
 * Client-side inactivity timer — the primary UX per the contract. Detects
 * mouse/keyboard/touch activity, warns at 25 minutes of no activity, and
 * logs out + redirects at 30 minutes. This is independent of the backend's
 * own last_active_at check (handleSessionExpiredIfNeeded above), which is
 * the security backstop, not the primary UX.
 *
 * Mount this once, near the root of any admin-only layout/page.
 */
export function useInactivityTimer(): InactivityTimerState {
  const [showWarning, setShowWarning] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_MS);

    logoutTimeoutRef.current = setTimeout(() => {
      clearTimers();
      redirectToSessionExpired();
    }, TIMEOUT_MS);
  }, [clearTimers]);

  useEffect(() => {
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    resetTimer();
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, resetTimer);
    }

    return () => {
      clearTimers();
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, resetTimer);
      }
    };
  }, [resetTimer, clearTimers]);

  return { showWarning };
}

/** Call this from a manual logout button, alongside logoutUser(), so no
 * stale inactivity timer keeps running after the user deliberately leaves. */
export function clearInactivityTimerOnManualLogout(): void {
  clearSessionState();
}