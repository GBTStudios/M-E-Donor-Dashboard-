"use client";

import { useEffect, useState, useCallback } from "react";
import { Monitor, Smartphone, Loader2 } from "lucide-react";
import {
  getSessions,
  revokeSession,
  revokeOtherSessions,
  isSessionsListError,
  isSimpleError,
  isRevokeOthersError,
  type DeviceSession,
} from "@/lib/security";

const ACCESS_TOKEN_KEY = "access_token";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Active now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function DeviceIcon({ os }: { os: string }) {
  const isMobile = /ios|android/i.test(os);
  const Icon = isMobile ? Smartphone : Monitor;
  return <Icon className="w-4 h-4 text-[#1A534A]" />;
}

export function ActiveSessionsList() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const loadSessions = useCallback(async () => {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getSessions(accessToken);
    setIsLoading(false);

    if (isSessionsListError(result)) {
      setError(result.message);
      return;
    }
    setSessions(result.sessions);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleSignOut(session: DeviceSession) {
    setError(undefined);
    setNotice(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setPendingId(session.id);
    const result = await revokeSession(accessToken, session.id);
    setPendingId(null);

    if (isSimpleError(result)) {
      setError(result.message);
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
  }

  async function handleSignOutOthers() {
    setError(undefined);
    setNotice(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsRevokingOthers(true);
    const result = await revokeOtherSessions(accessToken);
    setIsRevokingOthers(false);

    if (isRevokeOthersError(result)) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  }

  const hasOtherSessions = sessions.some((s) => !s.isCurrent);

  return (
    <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-[#1A534A]">Active Sessions</h2>
        {hasOtherSessions && (
          <button
            type="button"
            onClick={handleSignOutOthers}
            disabled={isRevokingOthers}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
          >
            {isRevokingOthers && <Loader2 className="w-3 h-3 animate-spin" />}
            Sign out all other devices
          </button>
        )}
      </div>
      <p className="text-sm text-[#5B7571] mb-4">
        Devices currently signed in to your account.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-[#1A534A] mb-3">{notice}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-[#7C9791]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : sessions.length === 0 && !error ? (
        <p className="text-sm text-[#7C9791]">No active sessions found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 bg-white/60 border border-black/10 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#CCEAE8] flex items-center justify-center flex-shrink-0">
                  <DeviceIcon os={session.os} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2C3E38] truncate">
                    {session.browser} on {session.os}
                    {session.isCurrent && (
                      <span className="ml-2 text-xs font-normal text-[#1A534A]">This device</span>
                    )}
                  </p>
                  <p className="text-xs text-[#7C9791] truncate">
                    {session.ipAddress}
                    {session.location ? ` · ${session.location}` : ""} ·{" "}
                    {formatRelativeTime(session.lastActiveAt)}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleSignOut(session)}
                  disabled={pendingId === session.id}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {pendingId === session.id && <Loader2 className="w-3 h-3 animate-spin" />}
                  Sign Out
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
