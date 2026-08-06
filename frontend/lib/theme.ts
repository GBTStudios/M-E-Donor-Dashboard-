/**
 * Theme utility — the single source of truth for reading, persisting, and
 * applying the user's theme preference to the DOM.
 *
 * "system" resolves against the OS preference at the moment it is applied,
 * so it automatically respects the user's current dark/light OS setting.
 */

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

/** Reads the persisted preference (falls back to "system" if nothing stored). */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

/** Persists the preference to localStorage. */
export function storeTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Applies or removes the `dark` class on <html> based on the given theme.
 * Call this any time the preference changes.
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", shouldBeDark);
}