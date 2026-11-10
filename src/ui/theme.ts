/**
 * Design D-07: appearance Light / Dark / System, default System, kept across
 * restarts. Stored in localStorage so it applies before the first paint;
 * without storage (private mode) it simply falls back to System.
 */
export type Theme = 'light' | 'dark' | 'system';
const KEY = 'gewohnheitsbaum.theme';

export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121812' : '#2f6b3a');
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // not persisted in private mode; the choice still applies for this visit
  }
  applyTheme(theme);
}
