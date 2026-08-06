"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_TIMEOUT_MESSAGE = "Session expired due to inactivity. Please log in again.";

const WARNING_MS = 25 * 60 * 1000;
const TIMEOUT_MS = 30 * 60 * 1000;

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
 * Call this after any authenticated API response.
 *
 * Redirects to /session-expired for ANY 401 — whether it's the inactivity
 * message from the backend timer, or a plain expired/invalid token. Both
 * mean the user's session is gone and they need to log in again.
 *
 * Returns true if a redirect was triggered — callers should stop processing.
 */
export function handleSessionExpiredIfNeeded(status: number, detail: unknown): boolean {
  if (status === 401) {
    redirectToSessionExpired();
    return true;
  }
  return false;
}

export interface InactivityTimerState {
  showWarning: boolean;
}

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

export function clearInactivityTimerOnManualLogout(): void {
  clearSessionState();
}