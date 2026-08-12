import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/** Minimal single-button light/dark toggle — a line-art sun that morphs
 * into a moon (pure CSS crossfade, no emoji). Click flips between the
 * two; there's no visible third "system" state, though useTheme still
 * follows the OS preference the first time someone visits. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="theme-toggle"
    >
      <Sun size={16} strokeWidth={1.75} className="theme-toggle__icon theme-toggle__icon--sun" />
      <Moon size={16} strokeWidth={1.75} className="theme-toggle__icon theme-toggle__icon--moon" />
    </button>
  );
}

