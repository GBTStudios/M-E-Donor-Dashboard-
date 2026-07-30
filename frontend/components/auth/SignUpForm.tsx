"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  validateSignUpField,
  validateSignUpForm,
  isSignUpFormValid,
  type SignUpFormValues,
  type SignUpFieldErrors,
} from "@/lib/validation";
import { signUp } from "@/lib/api";
import { PasswordField } from "@/components/ui/PasswordField";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";

const EMPTY_VALUES: SignUpFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const [values, setValues] = useState<SignUpFormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpFormValues, boolean>>>({});
  const [errors, setErrors] = useState<SignUpFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isValid = useMemo(() => {
    const hasAllValues = values.name && values.email && values.password && values.confirmPassword;
    return Boolean(hasAllValues) && isSignUpFormValid(validateSignUpForm(values));
  }, [values]);

  function handleChange(field: keyof SignUpFormValues, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateSignUpField(field, nextValues) }));
    }
    if (field === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateSignUpField("confirmPassword", nextValues),
      }));
    }
  }

  function handleBlur(field: keyof SignUpFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateSignUpField(field, values) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const allErrors = validateSignUpForm(values);
    setErrors(allErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!isSignUpFormValid(allErrors)) return;

    setIsSubmitting(true);
    try {
      const result = await signUp({
        full_name: values.name,
        email: values.email,
        password: values.password,
      });

      if (!result.success) {
        const errorResult = result as {
          success: false;
          message: string;
          fieldErrors?: Record<string, string>;
        };
        setFormError(errorResult.message);
        // Surface backend field-level errors (e.g. from a 422 response) as
        // if they were client-side validation errors, so they render inline
        // next to the right input rather than only in the top banner.
        if (errorResult.fieldErrors) {
          setErrors((prev) => ({
            ...prev,
            ...(errorResult.fieldErrors?.full_name ? { name: errorResult.fieldErrors.full_name } : {}),
            ...(errorResult.fieldErrors?.email ? { email: errorResult.fieldErrors.email } : {}),
            ...(errorResult.fieldErrors?.password ? { password: errorResult.fieldErrors.password } : {}),
          }));
        }
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignUp() {
    window.location.href = "/api/auth/google";
  }

  if (isSuccess) {
    return (
      <div className="w-screen min-h-screen bg-[#f5efe4] flex flex-col items-center justify-center p-8 sm:p-16">
        <div className="bg-[#eaf5f0] rounded-3xl p-12 sm:p-16 w-full max-w-2xl text-center shadow-sm border border-black/10">
          <div className="w-16 h-16 rounded-full bg-[#CCEAE8] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#1A534A]" />
          </div>
          <h1 className="text-3xl font-semibold text-[#1A534A] mb-3">Account created</h1>
          <p className="text-base text-[#5B7571] mb-8">
            We&apos;ve sent a verification code to <strong>{values.email}</strong>. Enter it next to
            activate your account.
          </p>
          <Link
            href={`/signup/verify?email=${encodeURIComponent(values.email)}`}
            className="inline-block w-full bg-[#1A534A] hover:bg-[#134038] text-white text-base font-semibold py-4 rounded-2xl transition-colors"
          >
            Continue to verification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-[#f5efe4] flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="bg-[#eaf5f0] rounded-2xl w-full max-w-md p-8 shadow-sm border border-black/10">
        <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">Create your account</h1>
        <p className="text-sm text-[#5B7571] mb-6">
          Enter your details to access your impact dashboard.
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
            <label htmlFor="name" className="block text-sm font-semibold text-[#3D524C] mb-2">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              placeholder="Jane Doe"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#2C3E38] placeholder:text-[#9FB0AC] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 ${
                errors.name ? "border-red-500" : "border-black/10"
              }`}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-2">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#3D524C] mb-2">
              Enter email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="jane@yourfoundation.org"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#2C3E38] placeholder:text-[#9FB0AC] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 ${
                errors.email ? "border-red-500" : "border-black/10"
              }`}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 mt-2">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <PasswordField
              id="password"
              label="Enter password"
              value={values.password}
              onChange={(v) => handleChange("password", v)}
              onBlur={() => handleBlur("password")}
              error={errors.password}
              placeholder="At least 8 characters"
            />
          </div>

          <PasswordStrengthMeter password={values.password} />

          <div>
            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={values.confirmPassword}
              onChange={(v) => handleChange("confirmPassword", v)}
              onBlur={() => handleBlur("confirmPassword")}
              error={errors.confirmPassword}
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-full transition-colors shadow-sm mt-1"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" data-testid="spinner" />}
            {isSubmitting ? "Creating account…" : "Continue"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#BBDEDC]" />
          </div>
          <span className="relative bg-[#eaf5f0] px-3 text-xs font-bold tracking-wider text-[#7C9791] uppercase">
            OR
          </span>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-2 bg-[#F7F1EB] hover:bg-[#FAF6F2] text-[#2C3E38] text-sm font-medium py-2.5 px-4 rounded-full shadow-sm transition-colors border border-transparent"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-[#5B7571] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1A534A] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
