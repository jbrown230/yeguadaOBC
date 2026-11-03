// context/ThemeContext.jsx
// Preferencia de tema: 'system' | 'light' | 'dark' (persistida). El atributo
// data-theme de <html> lo fija primero el script de public/index.html (sin parpadeo)
// y luego este proveedor lo mantiene sincronizado.
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const KEY = 'yeguada_theme';
const ThemeContext = createContext(null);

const readPref = () => {
  try { const v = localStorage.getItem(KEY); return ['light', 'dark', 'system'].includes(v) ? v : 'system'; }
  catch { return 'system'; }
};
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }) {
  const [pref, setPrefState] = useState(readPref);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSysDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0A0A0C' : '#F4F4F1');
  }, [resolved]);

  const setPref = useCallback((value) => {
    setPrefState(value);
    try { localStorage.setItem(KEY, value); } catch { /* storage bloqueado */ }
  }, []);

  const toggle = useCallback(() => setPref(resolved === 'dark' ? 'light' : 'dark'), [resolved, setPref]);

  const value = useMemo(() => ({ pref, resolved, setPref, toggle }), [pref, resolved, setPref, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
