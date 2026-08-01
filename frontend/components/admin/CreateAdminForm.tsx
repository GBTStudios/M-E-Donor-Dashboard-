"use client";

import { useState } from "react";
import { Loader2, XCircle, CheckCircle2, Copy } from "lucide-react";
import { createAdminUser } from "@/lib/adminAuth";

const ACCESS_TOKEN_KEY = "access_token";

/**
 * "Add Admin" form — only meant to be rendered when the current user's role
 * is superadmin (the parent dashboard page is responsible for that check;
 * this component doesn't re-verify role itself, since the real enforcement
 * is server-side per the contract's 403 rule).
 */
export function CreateAdminForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const isValid = email.trim().length > 0 && fullName.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setCreatedPassword(undefined);

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAdminUser(accessToken, email.trim(), fullName.trim());
      if (!result.success) {
        setError(result.message);
        return;
      }
      setCreatedPassword(result.temporaryPassword);
      setEmail("");
      setFullName("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!createdPassword) return;
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl w-full max-w-md p-6 shadow-sm border border-black/10">
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">Add Admin</h2>
      <p className="text-sm text-[#5B7571] mb-5">
        Create a new admin account. They&apos;ll be required to set their own password on first login.
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {createdPassword && (
        <div className="bg-white/70 border border-black/10 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1A534A] mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Admin created — share this temporary password securely
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-[#f5efe4] rounded px-2 py-1.5 break-all">
              {createdPassword}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy temporary password"
              className="p-1.5 rounded hover:bg-black/5 text-[#5B7571] flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <p className="text-xs text-[#1A534A] mt-1.5">Copied.</p>}
          <p className="text-xs text-[#7C9791] mt-2">
            This isn&apos;t sent automatically — share it with the new admin yourself, outside of this app.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="admin-full-name" className="block text-sm font-semibold text-[#3D524C] mb-1.5">
            Full name
          </label>
          <input
            id="admin-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Admin"
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#2C3E38] placeholder:text-[#9FB0AC] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40"
          />
        </div>

        <div>
          <label htmlFor="admin-email" className="block text-sm font-semibold text-[#3D524C] mb-1.5">
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newadmin@groundbreaker.org"
            className="w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-[#2C3E38] placeholder:text-[#9FB0AC] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40"
          />
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:bg-[#1A534A]/90 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-full transition-colors shadow-sm mt-1"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating…" : "Create Admin"}
        </button>
      </form>
    </div>
  );
}
