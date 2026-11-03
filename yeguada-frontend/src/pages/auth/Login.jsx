// pages/auth/Login.jsx — inicio de sesión, o creación del primer administrador
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import PasswordStrength, { passwordValid } from '../../components/auth/PasswordStrength';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { needsSetup, signIn, signUpFirstAdmin } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (needsSetup && !passwordValid(form.password)) { setError('La contraseña no cumple los requisitos'); return; }
    setBusy(true); setError('');
    try {
      if (needsSetup) await signUpFirstAdmin(form);
      else await signIn(form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={needsSetup ? 'Crea tu cuenta de administrador' : 'Bienvenido de vuelta'}
      subtitle={needsSetup
        ? 'Es la primera vez que se abre el panel. Esta cuenta tendrá control total.'
        : 'Inicia sesión para administrar el chatbot de La Yeguada.'}
      footer={!needsSetup && <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>}
    >
      {/* key={error}: re-monta el form para reiniciar la animación de sacudida */}
      <form onSubmit={onSubmit} noValidate className={error ? 'shake' : ''} key={error}>
        {needsSetup && (
          <AuthField label="Nombre" icon="user" autoComplete="name" value={form.name} onChange={set('name')} required />
        )}
        <AuthField label="Correo electrónico" icon="mail" type="email" autoComplete="username" inputMode="email"
          value={form.email} onChange={set('email')} required autoFocus />
        <AuthField label="Contraseña" icon="lock" type="password"
          autoComplete={needsSetup ? 'new-password' : 'current-password'}
          value={form.password} onChange={set('password')} required />
        {needsSetup && <PasswordStrength value={form.password} />}

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button className="auth-submit" disabled={busy || !form.email || !form.password}>
          {busy ? <span className="auth-spinner" /> : needsSetup ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthShell>
  );
}
