// context/AuthContext.jsx
// Estado de sesión global. status: 'loading' | 'authed' | 'anon' | 'offline'
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as authApi from '../services/api/auth';

const AuthContext = createContext(null);

// Datos de la sesión anterior que no deben verse al entrar otro usuario.
const CACHE_KEYS = ['yeguada_metrics_cache'];
function clearCaches() {
  CACHE_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { /* storage bloqueado */ } });
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, needsSetup: false });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const { user, needsSetup } = await authApi.fetchAuthStatus();
      setState({ status: user ? 'authed' : 'anon', user, needsSetup });
    } catch {
      setState({ status: 'offline', user: null, needsSetup: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Cualquier 401 fuera de /auth (sesión expirada o revocada) → al login.
  useEffect(() => {
    const onUnauthorized = () => setState((s) => (s.status === 'authed' ? { status: 'anon', user: null, needsSetup: false } : s));
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { user } = await authApi.login(email, password);
    clearCaches();
    setState({ status: 'authed', user, needsSetup: false });
  }, []);

  const signUpFirstAdmin = useCallback(async (payload) => {
    const { user } = await authApi.setupAdmin(payload);
    clearCaches();
    setState({ status: 'authed', user, needsSetup: false });
  }, []);

  const signOut = useCallback(async () => {
    try { await authApi.logout(); } catch { /* aunque falle, cerramos localmente */ }
    clearCaches();
    setState({ status: 'anon', user: null, needsSetup: false });
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signUpFirstAdmin, signOut, refresh }),
    [state, signIn, signUpFirstAdmin, signOut, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
