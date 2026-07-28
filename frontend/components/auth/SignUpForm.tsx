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
    // Re-validate confirmPassword whenever password changes, since its
    // validity depends on both fields together.
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

    // Validate everything on submit regardless of touched state, in case
    // someone pastes values in or tabs through without triggering blur.
    const allErrors = validateSignUpForm(values);
    setErrors(allErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!isSignUpFormValid(allErrors)) return;

    setIsSubmitting(true);
    try {
      const result = await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: ""
      });

      if (!result.success) {
        setFormError(result.message);
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
      <div className="bg-white rounded-card shadow-card p-10 w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-brand-mint flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-brand-primary" />
        </div>
        <h1 className="text-xl font-semibold text-brand-ink mb-2">Account created</h1>
        <p className="text-sm text-brand-muted mb-6">
          We&apos;ve sent a verification code to <strong>{values.email}</strong>. Enter it next to
          activate your account.
        </p>
        <Link
          href="/signup/verify"
          className="inline-block w-full bg-brand-primary hover:bg-brand-primaryHover text-white text-sm font-semibold py-3 rounded-full transition-colors"
        >
          Continue to verification
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-mint rounded-card shadow-card w-full max-w-xl px-10 py-6 sm:px-14 sm:py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-md bg-brand-primary text-white flex items-center justify-center text-sm font-bold">
          G
        </div>
        <span className="font-semibold text-brand-ink text-[15px]">Groundbreaker Impact</span>
      </div>

      <h1 className="text-2xl font-semibold text-brand-ink mb-1">Create your account</h1>
      <p className="text-sm text-brand-muted mb-6">
        Get verified access to Groundbreaker&apos;s impact dashboard.
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

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="name" className="block text-xs font-semibold text-brand-ink mb-1.5">
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
           className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${
           errors.name ? "border-status-danger" : "border-brand-border"
           }`}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-status-danger mt-1.5">
              {errors.name}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-xs font-semibold text-brand-ink mb-1.5">
            Work email
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
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${
            errors.email ? "border-status-danger" : "border-brand-border"
          }`}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-status-danger mt-1.5">
              {errors.email}
            </p>
          )}
        </div>

        <div className="mb-2">
          <PasswordField
            id="password"
            label="Password"
            value={values.password}
            onChange={(v) => handleChange("password", v)}
            onBlur={() => handleBlur("password")}
            error={errors.password}
            placeholder="At least 8 characters"
          />
        </div>

        <PasswordStrengthMeter password={values.password} />

        <div className="mb-5">
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
          className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-full transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" data-testid="spinner" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-xs text-brand-muted">or</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="w-full flex items-center justify-center gap-2 bg-white border border-brand-border text-brand-ink text-sm font-semibold py-3 rounded-full hover:bg-brand-cream/40 transition-colors">
        Continue with Google
      </button>

      <p className="text-center text-sm text-brand-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-primary font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}
