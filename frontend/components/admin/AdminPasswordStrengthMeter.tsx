"use client";

import { useTranslation } from "react-i18next";
import { getAdminPasswordRequirements } from "@/lib/adminPassword";

export interface AdminPasswordStrengthMeterProps {
  password: string;
}

const SEGMENT_COLORS = ["#E4DFD1", "#B3402A", "#B08900", "#1c5e59"];
const LABEL_KEYS = [
  "password.strength.tooWeak",
  "password.strength.weak",
  "password.strength.good",
  "password.strength.strong",
];

/**
 * Live strength meter for the admin first-login password setup. Segment
 * count is driven directly by how many of the 3 admin requirements are met
 * (lib/adminPassword.ts) — this never diverges from the checklist shown
 * alongside it, since both read from the same requirements list.
 */
export function AdminPasswordStrengthMeter({ password }: AdminPasswordStrengthMeterProps) {
  const { t } = useTranslation("common");
  if (!password) return null;

  const requirements = getAdminPasswordRequirements(password);
  const metCount = requirements.filter((r) => r.met).length;
  const color = SEGMENT_COLORS[metCount];
  const label = t(LABEL_KEYS[metCount]);
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
