"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { requestResetCode } from "@/lib/auth";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const result = await requestResetCode(email);
    setLoading(false);

    if (result.success) {
      sessionStorage.setItem("resetEmail", email);
      router.push("/forgot-password/verify");
    } else {
      setError(result.error);
    }
  }

  return (
    <div>
      <div className="w-10 h-10 rounded-lg bg-teal-800 flex items-center justify-center mb-4">
        <ShieldCheck className="w-5 h-5 text-white" />
      </div>

      <h1 className="text-2xl font-semibold text-gray-800">Reset your password</h1>
      <p className="text-sm text-gray-500 mt-1">
        Enter the code sent to the email address associated with your Groundbreaker account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Work Email Address
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send code"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        <p className="text-xs text-center text-gray-400">
          For security reasons, this code will expire in 30 minutes.
        </p>
      </form>
    </div>
  );
}