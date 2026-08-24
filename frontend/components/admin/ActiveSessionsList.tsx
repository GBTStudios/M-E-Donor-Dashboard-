"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Smartphone, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
const PAGE_SIZE = 5;

function DeviceIcon({ os }: { os: string }) {
  const isMobile = /ios|android/i.test(os);
  const Icon = isMobile ? Smartphone : Monitor;
  return <Icon className="w-4 h-4 text-[#1A534A] dark:text-[#7dd3c0]" />;
}

export function ActiveSessionsList() {
  const { t } = useTranslation("donor");
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  function formatRelativeTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("shared.sessions.activeNow");
    if (diffMin < 60) return t("shared.sessions.minutesAgo", { count: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t("shared.sessions.hoursAgo", { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    return t("shared.sessions.daysAgo", { count: diffDays });
  }

  const loadSessions = useCallback(async () => {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError(t("errors.sessionExpiredGeneric"));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleSignOut(session: DeviceSession) {
    setError(undefined);
    setNotice(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError(t("errors.sessionExpiredGeneric"));
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
      setError(t("errors.sessionExpiredGeneric"));
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
    setPage(1);
  }

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const paginated = sessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasOtherSessions = sessions.some((s) => !s.isCurrent);

  return (
    <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-[#1A534A] dark:text-[#7dd3c0]">{t("shared.sessions.title")}</h2>
        {hasOtherSessions && (
          <button
            type="button"
            onClick={handleSignOutOthers}
            disabled={isRevokingOthers}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            {isRevokingOthers && <Loader2 className="w-3 h-3 animate-spin" />}
            {t("shared.sessions.signOutOthers")}
          </button>
        )}
      </div>
      <p className="text-sm text-[#5B7571] dark:text-[#8fada9] mb-4">
        {t("shared.sessions.description")}
      </p>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
      {notice && <p className="text-sm text-[#1A534A] dark:text-[#7dd3c0] mb-3">{notice}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-[#7C9791]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : sessions.length === 0 && !error ? (
        <p className="text-sm text-[#7C9791] dark:text-[#5a9e94]">{t("shared.sessions.noSessions")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {paginated.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#CCEAE8] dark:bg-[#2a6b5e] flex items-center justify-center flex-shrink-0">
                    <DeviceIcon os={session.os} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0] truncate">
                      {session.browser} on {session.os}
                      {session.isCurrent && (
                        <span className="ml-2 text-xs font-normal text-[#5B7571] dark:text-[#8fada9]">
                          {t("shared.sessions.thisDevice")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] truncate">
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
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {pendingId === session.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    {t("shared.sessions.signOut")}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5 dark:border-white/10">
              <p className="text-xs text-[#7C9791] dark:text-[#5a9e94]">
                {t("shared.sessions.showingRange", {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, sessions.length),
                  total: sessions.length,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-lg text-[#1A534A] dark:text-[#7dd3c0] disabled:opacity-30 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[#5B7571] dark:text-[#8fada9] px-2">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded-lg text-[#1A534A] dark:text-[#7dd3c0] disabled:opacity-30 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}