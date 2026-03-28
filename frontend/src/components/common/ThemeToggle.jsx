import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700 hover:text-white ${className}`}
    >
      <span className="text-base leading-none">{isDark ? '🌙' : '☀️'}</span>
      {!compact && <span>{isDark ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  );
}
