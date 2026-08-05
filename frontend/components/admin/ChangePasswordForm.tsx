"use client";

import { useState } from "react";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { PasswordField } from "@/components/ui/PasswordField";
import { AdminPasswordStrengthMeter } from "@/components/admin/AdminPasswordStrengthMeter";
import { PasswordRequirementChecklist } from "@/components/admin/PasswordRequirementChecklist";
import { isAdminPasswordValid, validateConfirmAdminPassword } from "@/lib/adminPassword";
import { changePassword, isSimpleError } from "@/lib/security";

const ACCESS_TOKEN_KEY = "access_token";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    currentPassword.length > 0 &&
    isAdminPasswordValid(newPassword) &&
    confirmPassword.length > 0 &&
    confirmPassword === newPassword;

  function handleConfirmChange(value: string) {
    setConfirmPassword(value);
    if (confirmTouched) setConfirmError(validateConfirmAdminPassword(newPassword, value));
  }

  function handleConfirmBlur() {
    setConfirmTouched(true);
    setConfirmError(validateConfirmAdminPassword(newPassword, confirmPassword));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    setConfirmTouched(true);

    const confirmValidation = validateConfirmAdminPassword(newPassword, confirmPassword);
    setConfirmError(confirmValidation);
    if (!isAdminPasswordValid(newPassword) || confirmValidation) return;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(accessToken, currentPassword, newPassword);
    setIsSubmitting(false);

    if (isSimpleError(result)) {
      setError(result.message);
      return;
    }

    setSuccess(result.message);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setConfirmTouched(false);
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1A534A] mb-1">Update Password</h2>
      <p className="text-sm text-[#5B7571] mb-5">
        Change your account password. You&apos;ll stay signed in on this device.
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

      {success && (
        <div className="flex items-start gap-2 bg-[#CCEAE8] text-[#1A534A] text-sm rounded-lg px-4 py-3 mb-4">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4 items-start">
        <PasswordField
          id="current-password"
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Enter current password"
        />

        <div>
          <PasswordField
            id="new-password"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter new password"
            describedByExtra="change-password-requirements"
          />
          <div id="change-password-requirements">
            <AdminPasswordStrengthMeter password={newPassword} />
            <PasswordRequirementChecklist password={newPassword} />
          </div>
        </div>

        <PasswordField
          id="confirm-new-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={handleConfirmChange}
          onBlur={handleConfirmBlur}
          error={confirmTouched ? confirmError : undefined}
          placeholder="Re-enter new password"
        />

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:bg-[#1A534A]/90 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
