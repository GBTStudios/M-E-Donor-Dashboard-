"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { deactivateUser, reactivateUser } from "@/lib/adminAuth";

const ACCESS_TOKEN_KEY = "access_token";

interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "superadmin";
  isActive: boolean;
}

/**
 * PLACEHOLDER DATA — there is currently no documented backend endpoint to
 * fetch the list of admin accounts (the contract only defines create,
 * deactivate, and reactivate, not a "list all admins" GET endpoint).
 *
 * This array exists purely so the UI has something to render and the
 * deactivate/reactivate buttons have real rows to act on during frontend
 * development. Replace this entirely with a real fetch call once a list
 * endpoint (e.g. GET /admin/users) is added to the contract — do not ship
 * this hardcoded list to production.
 */
const PLACEHOLDER_ACCOUNTS: AdminAccount[] = [
  { id: "placeholder-1", fullName: "Jane Admin", email: "jane@groundbreaker.org", role: "admin", isActive: true },
  { id: "placeholder-2", fullName: "Sam Reyes", email: "sam@groundbreaker.org", role: "admin", isActive: false },
];

export function AdminAccountList() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(PLACEHOLDER_ACCOUNTS);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleToggleActive(account: AdminAccount) {
    setError(undefined);
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

  return (
    <div className="bg-[#eaf5f0] rounded-2xl w-full max-w-md p-6 shadow-sm border border-black/10">
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">Admin Accounts</h2>
      <p className="text-xs text-[#B3402A] mb-4">
        Showing placeholder data — a real account list endpoint is not yet available.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex items-center justify-between gap-3 bg-white/60 border border-black/10 rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2C3E38] truncate">{account.fullName}</p>
              <p className="text-xs text-[#7C9791] truncate">{account.email}</p>
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  account.isActive
                    ? "bg-[#CCEAE8] text-[#1A534A]"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {account.isActive ? "Active" : "Deactivated"}
              </span>
            </div>

            {account.role !== "superadmin" && (
              <button
                type="button"
                onClick={() => handleToggleActive(account)}
                disabled={pendingId === account.id}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                  account.isActive
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-[#CCEAE8] text-[#1A534A] hover:bg-[#bce3e0]"
                }`}
              >
                {pendingId === account.id && <Loader2 className="w-3 h-3 animate-spin" />}
                {account.isActive ? "Deactivate" : "Reactivate"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
