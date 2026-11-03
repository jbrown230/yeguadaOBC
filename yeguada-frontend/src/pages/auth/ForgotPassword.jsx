// pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import Icon from '../../components/Icon';
import { forgotPassword } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { await forgotPassword(email); setSent(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const back = <Link to="/login" className="auth-back"><Icon name="arrowLeft" size={14} /> Volver a iniciar sesión</Link>;

  if (sent) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle={`Si ${email} corresponde a una cuenta, te enviamos un enlace para crear una nueva contraseña. Vence en 30 minutos.`}
        footer={back}
      >
        <div className="auth-success"><Icon name="mail" size={26} /></div>
        <p className="auth-hint">
          ¿No llega? Revisa spam o{' '}
          <button type="button" className="auth-linkbtn" onClick={() => setSent(false)}>intenta de nuevo</button>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="¿Olvidaste tu contraseña?" subtitle="Escribe tu correo y te enviaremos un enlace para restablecerla." footer={back}>
      <form onSubmit={onSubmit} noValidate>
        <AuthField label="Correo electrónico" icon="mail" type="email" autoComplete="username" inputMode="email"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} required autoFocus />
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={busy || !email}>
          {busy ? <span className="auth-spinner" /> : 'Enviar enlace'}
        </button>
      </form>
    </AuthShell>
  );
}
