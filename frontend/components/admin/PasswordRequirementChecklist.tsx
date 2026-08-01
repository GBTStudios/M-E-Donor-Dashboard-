"use client";

import { Check, X } from "lucide-react";
import { getAdminPasswordRequirements } from "@/lib/adminPassword";

export interface PasswordRequirementChecklistProps {
  password: string;
}

/**
 * Live per-rule checklist, distinct from the strength meter — the ticket
 * calls for both simultaneously. Updates on every keystroke since it just
 * re-derives from getAdminPasswordRequirements, the same source of truth
 * the strength meter and submit-button gating both use.
 */
export function PasswordRequirementChecklist({ password }: PasswordRequirementChecklistProps) {
  const requirements = getAdminPasswordRequirements(password);

  return (
    <ul className="flex flex-col gap-1 mt-2">
      {requirements.map((req) => (
        <li
          key={req.id}
          className={`flex items-center gap-2 text-xs transition-colors ${
            req.met ? "text-[#1c5e59]" : "text-[#8a8578]"
          }`}
        >
          {req.met ? (
            <Check className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          ) : (
            <X className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          )}
          <span>{req.label}</span>
        </li>
      ))}
    </ul>
  );
}
