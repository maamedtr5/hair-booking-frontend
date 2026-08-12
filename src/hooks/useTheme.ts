import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

// Must match the key index.html's pre-paint script reads.
const STORAGE_KEY = 'theme';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? getSystemTheme() : pref;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}

function getStoredPreference(): ThemePreference {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

/**
 * Reads/writes the theme preference (light / dark / follow-OS) and keeps
 * the <html data-theme> attribute — which is all index.css's dark-mode
 * block actually looks at — in sync with it. 'system' is never written
 * to localStorage; index.html's blocking script already treats "nothing
 * saved" as system, so this keeps the two in agreement without a third
 * stored value to drift out of sync.
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);

  // Live-update if the OS theme changes while "system" is selected —
  // otherwise switching your OS to dark mode wouldn't take effect here
  // until the next reload.
  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(getSystemTheme());
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    if (next === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
    applyTheme(resolve(next));
  }, []);

  return { preference, resolvedTheme: resolve(preference), setTheme };
}
