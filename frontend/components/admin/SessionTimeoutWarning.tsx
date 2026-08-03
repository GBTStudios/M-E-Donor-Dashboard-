"use client";

import { AlertTriangle } from "lucide-react";

export function SessionTimeoutWarning() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#1A534A] text-white rounded-xl shadow-lg px-5 py-4 max-w-sm"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#F4C542] mt-0.5" />
      <div>
        <p className="text-sm font-semibold">You&apos;ll be logged out soon</p>
        <p className="text-xs text-white/80 mt-0.5">
          You&apos;ve been inactive for a while. Move your mouse or press a key to stay signed in.
        </p>
      </div>
    </div>
  );
}
