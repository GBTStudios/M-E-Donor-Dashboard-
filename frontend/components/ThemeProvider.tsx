"use client";

/**
 * ThemeProvider — mounts once at the root layout and is responsible for:
 *   1. Reading the stored preference from localStorage on first load.
 *   2. Applying the correct `dark` class to <html> immediately.
 *   3. Listening for OS-level dark/light changes so "system" stays live.
 *
 * It renders no markup of its own — it's purely a behaviour layer.
 */

import { useEffect } from "react";
import { getStoredTheme, applyTheme } from "@/lib/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply on mount so the correct class is set before paint.
    const stored = getStoredTheme();
    applyTheme(stored);

    // Keep "system" in sync if the user changes their OS preference while
    // the tab is open.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      const current = getStoredTheme();
      if (current === "system") applyTheme("system");
    }

    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  return <>{children}</>;
}
