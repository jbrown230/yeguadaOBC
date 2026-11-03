// pages/auth/ResetPassword.jsx — destino del enlace del correo (?token=…)
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import PasswordStrength, { passwordValid } from '../../components/auth/PasswordStrength';
import Icon from '../../components/Icon';
import { validateResetToken, resetPassword } from '../../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [tokenState, setTokenState] = useState('checking'); // checking | valid | invalid
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setTokenState('invalid'); return; }
    validateResetToken(token)
      .then(({ valid }) => setTokenState(valid ? 'valid' : 'invalid'))
      .catch(() => setTokenState('invalid'));
  }, [token]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate('/login', { replace: true }), 2600);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const mismatch = confirm && password !== confirm ? 'Las contraseñas no coinciden' : '';

  async function onSubmit(e) {
    e.preventDefault();
    if (busy || mismatch || !passwordValid(password)) return;
    setBusy(true); setError('');
    try { await resetPassword(token, password); setDone(true); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  if (tokenState === 'checking') {
    return (
      <AuthShell title="Verificando enlace…">
        <div className="auth-success"><span className="auth-spinner dark" /></div>
      </AuthShell>
    );
  }
  if (tokenState === 'invalid') {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="Este enlace ya se usó o expiró. Solicita uno nuevo para continuar."
        footer={<Link to="/login" className="auth-back"><Icon name="arrowLeft" size={14} /> Volver a iniciar sesión</Link>}
      >
        <Link to="/forgot-password" className="auth-submit as-link">Solicitar nuevo enlace</Link>
      </AuthShell>
    );
  }
  if (done) {
    return (
      <AuthShell title="¡Contraseña actualizada!" subtitle="Ya puedes iniciar sesión con tu nueva contraseña. Te redirigimos en un momento…">
        <div className="auth-success ok"><Icon name="check" size={28} strokeWidth={2.4} /></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crea una nueva contraseña" subtitle="Elige una contraseña segura que no uses en otros sitios.">
      <form onSubmit={onSubmit} noValidate>
        <AuthField label="Nueva contraseña" icon="lock" type="password" autoComplete="new-password"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} required autoFocus />
        <PasswordStrength value={password} />
        <AuthField label="Confirmar contraseña" icon="lock" type="password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch} required />
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={busy || !passwordValid(password) || password !== confirm}>
          {busy ? <span className="auth-spinner" /> : 'Guardar contraseña'}
        </button>
      </form>
    </AuthShell>
  );
}
