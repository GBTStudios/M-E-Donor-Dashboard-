"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  describedByExtra?: string;
}

/**
 * A labeled password input with a show/hide toggle and inline error text.
 * Shared by Sign Up, Login, and the password-reset flow so the visual
 * treatment and accessibility wiring stay identical everywhere.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete = "new-password",
  describedByExtra,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  const describedBy = [error ? errorId : null, describedByExtra ?? null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-brand-ink mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-brand-ink placeholder:text-brand-muted bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-primary/30 ${
          error ? "border-status-danger" : "border-brand-border"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-status-danger mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
