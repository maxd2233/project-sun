import { useEffect } from 'react';
import { useAppState } from '../store/context';
import type { ThemePreference } from '../types';
import { usePrefersDarkScheme } from './useMediaQuery';

/** Resolve the effective theme for a user preference. */
export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

/**
 * Keeps the `data-theme` attribute on <html> in sync with settings,
 * following the OS preference when set to `system`.
 */
export function useThemeSync(): void {
  const { state } = useAppState();
  const prefersDark = usePrefersDarkScheme();

  useEffect(() => {
    const theme = resolveTheme(state.settings.theme, prefersDark);
    const root = document.documentElement;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f59e0b');
    }
  }, [state.settings.theme, prefersDark]);
}
