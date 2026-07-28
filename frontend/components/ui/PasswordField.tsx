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
      <label htmlFor={id} className="block text-sm font-semibold text-[#3D524C] mb-2">
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
          className={`w-full rounded-2xl border-none px-5 py-4 pr-12 text-base text-[#2C3E38] placeholder:text-[#9FB0AC] bg-[#F8F5F0] focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 ${
            error ? "ring-2 ring-red-500" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7C9791] hover:text-[#2C3E38] p-1 transition-colors"
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}