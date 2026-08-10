"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  deactivateUser,
  reactivateUser,
  deleteAdminUser,
  getAdminUsersList,
  type AdminUser,
} from "@/lib/adminAuth";

const ACCESS_TOKEN_KEY = "access_token";

export function AdminAccountList() {
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const loadAccounts = useCallback(async () => {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getAdminUsersList(accessToken);
    setIsLoading(false);
    if (!result.success) {
      const failure = result as { success: false; message: string };
      setError(failure.message);
      return;
    }
    setAccounts(result.users);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function handleToggleActive(account: AdminUser) {
    setError(undefined);
    setNotice(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }
    setPendingId(account.id);
    try {
      const result = account.isActive
        ? await deactivateUser(accessToken, account.id)
        : await reactivateUser(accessToken, account.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(account: AdminUser) {
    setError(undefined);
    setNotice(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }
    setDeletingId(account.id);
    setConfirmDeleteId(null);
    const result = await deleteAdminUser(accessToken, account.id);
    setDeletingId(null);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setAccounts((prev) => prev.filter((a) => a.id !== account.id));
  }

  return (
    <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl w-full max-w-md p-6 shadow-sm border border-black/10 dark:border-white/10">
      <h2 className="text-lg font-semibold text-[#1A534A] dark:text-[#7dd3c0] mb-4">Admin Accounts</h2>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
      )}
      {notice && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-3">{notice}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-[#7C9791]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : accounts.length === 0 && !error ? (
        <p className="text-sm text-[#7C9791] dark:text-[#5a9e94]">No admin accounts found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((account) => (
            <li key={account.id} className="flex flex-col gap-2 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0] truncate">
                    {account.fullName}
                  </p>
                  <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] truncate">{account.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    account.isActive
                      ? "bg-[#CCEAE8] dark:bg-emerald-900/30 text-[#1A534A] dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}>
                    {account.isActive ? "Active" : "Deactivated"}
                  </span>
                </div>

                {account.role !== "superadmin" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Activate / Deactivate */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(account)}
                      disabled={pendingId === account.id || deletingId === account.id}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                        account.isActive
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "bg-[#CCEAE8] dark:bg-[#2a6b5e] text-[#1A534A] dark:text-[#7dd3c0] hover:bg-[#bce3e0] dark:hover:bg-[#2d4f4a]"
                      }`}
                    >
                      {pendingId === account.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      {account.isActive ? "Deactivate" : "Reactivate"}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(account.id)}
                      disabled={deletingId === account.id || pendingId === account.id}
                      aria-label={`Delete ${account.fullName}`}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      {deletingId === account.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Inline confirmation */}
              {confirmDeleteId === account.id && (
                <div className="flex items-center justify-between gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mt-1">
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    Permanently delete this account?
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-semibold text-[#5B7571] dark:text-[#8fada9] hover:text-[#1A534A] dark:hover:text-[#7dd3c0]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(account)}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
