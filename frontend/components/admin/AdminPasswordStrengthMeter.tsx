"use client";

import { getAdminPasswordRequirements } from "@/lib/adminPassword";

export interface AdminPasswordStrengthMeterProps {
  password: string;
}

const SEGMENT_COLORS = ["#E4DFD1", "#B3402A", "#B08900", "#1c5e59"];
const LABELS = ["Too weak", "Weak", "Good", "Strong"];

/**
 * Live strength meter for the admin first-login password setup. Segment
 * count is driven directly by how many of the 3 admin requirements are met
 * (lib/adminPassword.ts) — this never diverges from the checklist shown
 * alongside it, since both read from the same requirements list.
 */
export function AdminPasswordStrengthMeter({ password }: AdminPasswordStrengthMeterProps) {
  if (!password) return null;

  const requirements = getAdminPasswordRequirements(password);
  const metCount = requirements.filter((r) => r.met).length;
  const color = SEGMENT_COLORS[metCount];
  const label = LABELS[metCount];
  const segments = [0, 1, 2];

  return (
    <div className="flex flex-col gap-1" aria-live="polite">
      <div className="flex gap-1">
        {segments.map((segmentIndex) => (
          <span
            key={segmentIndex}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: segmentIndex < metCount ? color : "#E4DFD1",
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
