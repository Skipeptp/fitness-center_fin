import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'volt_theme';

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

const detectInitial = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Системная темa
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => detectInitial());

  // Применяем при монтировании и каждой смене
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
