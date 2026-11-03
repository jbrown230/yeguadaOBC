// App.jsx — Root: decide entre pantallas de acceso y el panel según la sesión
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ForceChangePassword from './pages/auth/ForceChangePassword';
import AuthShell from './components/auth/AuthShell';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { status, user, refresh } = useAuth();

  if (status === 'loading') {
    return <div className="splash"><div className="spinner" /></div>;
  }

  if (status === 'offline') {
    return (
      <AuthShell title="Sin conexión con el servidor" subtitle="No pudimos contactar al backend. Verifica que esté en ejecución e inténtalo de nuevo.">
        <button className="auth-submit" onClick={refresh}>Reintentar</button>
      </AuthShell>
    );
  }

  return (
    <Routes>
      {/* El enlace del correo debe funcionar con o sin sesión abierta */}
      <Route path="/reset-password" element={<ResetPassword />} />
      {status === 'authed' && user?.mustChangePassword ? (
        // Contraseña temporal: nada del panel hasta definir una propia (el backend también lo exige)
        <Route path="*" element={<ForceChangePassword />} />
      ) : status === 'authed' ? (
        <>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/" replace />} />
          <Route path="*" element={<AppShell />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}
