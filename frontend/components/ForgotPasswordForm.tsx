"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { requestResetCode } from "@/lib/auth";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate(value: string) {
    if (!value.trim()) return "Email is required.";
    if (!isValidEmail(value)) return "Please enter a valid email address.";
    return "";
  }

  function handleChange(value: string) {
    setEmail(value);
    if (touched) {
      setFieldError(validate(value));
    }
  }

  function handleBlur() {
    setTouched(true);
    setFieldError(validate(email));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setTouched(true);

    const validationError = validate(email);
    setFieldError(validationError);
    if (validationError) return;

    setLoading(true);
    const result = await requestResetCode(email);
    setLoading(false);

    if (!result.success) {
      const errorResult = result as { success: false; error: string };
      setFormError(errorResult.error);
      return;
    }

    sessionStorage.setItem("resetEmail", email);
    router.push("/forgot-password/verify");
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Work Email Address
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "email-error" : undefined}
              placeholder="name@organization.org"
              className={`w-full pl-9 pr-3 py-2.5 rounded-lg border bg-white/60 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700 ${
                fieldError ? "border-red-500" : "border-black/10"
              }`}
            />
          </div>
          {fieldError && (
            <p id="email-error" className="text-sm text-red-600 mt-2">
              {fieldError}
            </p>
          )}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

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