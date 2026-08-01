"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { PasswordField } from "@/components/ui/PasswordField";
import { AdminPasswordStrengthMeter } from "@/components/admin/AdminPasswordStrengthMeter";
import { PasswordRequirementChecklist } from "@/components/admin/PasswordRequirementChecklist";
import {
  isAdminPasswordValid,
  validateConfirmAdminPassword,
} from "@/lib/adminPassword";
import { setFirstPassword, clearFirstLoginFlag, getFirstLoginFlag } from "@/lib/adminAuth";

const ACCESS_TOKEN_KEY = "access_token";

export function SetPasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If someone lands here directly but has already completed first-login
  // setup (first_login is false), there's nothing to do here — send them
  // onward rather than showing a stale forced-setup screen.
  useEffect(() => {
    if (!getFirstLoginFlag()) {
      router.replace("/admin-dashboard");
    }
  }, [router]);

  const isValid = useMemo(() => {
    return (
      isAdminPasswordValid(newPassword) &&
      confirmPassword.length > 0 &&
      confirmPassword === newPassword
    );
  }, [newPassword, confirmPassword]);

  function handleConfirmChange(value: string) {
    setConfirmPassword(value);
    if (confirmTouched) {
      setConfirmError(validateConfirmAdminPassword(newPassword, value));
    }
  }

  function handleConfirmBlur() {
    setConfirmTouched(true);
    setConfirmError(validateConfirmAdminPassword(newPassword, confirmPassword));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setConfirmTouched(true);

    const confirmValidation = validateConfirmAdminPassword(newPassword, confirmPassword);
    setConfirmError(confirmValidation);

    if (!isAdminPasswordValid(newPassword) || confirmValidation) return;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setFormError("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setFirstPassword(accessToken, newPassword);
      if (!result.success) {
        setFormError(result.message);
        return;
      }
      clearFirstLoginFlag();
      router.push("/admin-dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl w-full max-w-md p-8 shadow-sm border border-black/10">
      <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">Set up your password</h1>
      <p className="text-sm text-[#5B7571] mb-6">
        For your account&apos;s security, choose a new password before continuing.
      </p>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <PasswordField
            id="new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter your new password"
            describedByExtra="password-requirements"
          />
          <div id="password-requirements">
            <AdminPasswordStrengthMeter password={newPassword} />
            <PasswordRequirementChecklist password={newPassword} />
          </div>
        </div>

        <div>
          <PasswordField
            id="confirm-new-password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={handleConfirmChange}
            onBlur={handleConfirmBlur}
            error={confirmTouched ? confirmError : undefined}
            placeholder="Re-enter your new password"
          />
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-full transition-colors shadow-sm mt-1"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" data-testid="spinner" />}
          {isSubmitting ? "Setting password…" : "Set Password & Continue"}
        </button>
      </form>
    </div>
  );
}
