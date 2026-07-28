"use client";

import { getPasswordStrength } from "@/lib/validation";

export interface PasswordStrengthMeterProps {
  password: string;
}

/**
 * Live strength meter driven entirely by lib/validation.ts's scoring —
 * this component only renders, it never re-implements the scoring rules.
 * Renders nothing until the user has typed something, so an empty field
 * doesn't show a "Too weak" judgment before they've started.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);
  const segments = [0, 1, 2, 3];

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="flex gap-1">
        {segments.map((segmentIndex) => (
          <span
            key={segmentIndex}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: segmentIndex < score ? color : "#E4DFD1",
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
