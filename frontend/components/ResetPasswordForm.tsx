"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LogIn } from "lucide-react";
import { resetPassword } from "@/lib/auth";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem("resetVerified");
    const storedEmail = sessionStorage.getItem("resetEmail");

    if (!verified || !storedEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const allRulesMet = Object.values(rules).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!allRulesMet) {
      setError("Password does not meet the requirements above.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const code = sessionStorage.getItem("resetCode") ?? "";
    const result = await resetPassword(email, code, password);
    setLoading(false);

    if (!result.success) {
      const errorResult = result as { success: false; error: string };
      setError(errorResult.error);
      return;
    }
    sessionStorage.removeItem("resetEmail");
    sessionStorage.removeItem("resetVerified");
    sessionStorage.removeItem("resetCode");
    setDone(true);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Password Reset!</h1>
        <p className="text-sm text-gray-500 mt-2">
          Your password has been changed successfully. Use your new credentials to access your donor dashboard.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition"
        >
          <LogIn className="w-4 h-4" />
          Return to Login
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Create new password</h1>
      <p className="text-sm text-gray-500 mt-1">
        Your new password must be different from any previously used passwords.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-teal-700 flex items-center gap-1"
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <div className="text-xs">
          <div className="flex justify-between text-gray-500 mb-1">
            <span className="font-medium">PASSWORD STRENGTH</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-gray-500">
            <RuleItem met={rules.length} label="At least 8 characters" />
            <RuleItem met={rules.uppercase} label="One uppercase letter" />
            <RuleItem met={rules.number} label="One numeric digit" />
            <RuleItem met={rules.special} label="One special character" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-xs text-teal-700 flex items-center gap-1"
            >
              {showConfirm ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!allRulesMet || !passwordsMatch || loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 ${met ? "text-green-600" : "text-gray-400"}`}>
      <CheckCircle2 className="w-3 h-3" />
      {label}
    </div>
  );
}