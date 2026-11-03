// pages/auth/ForceChangePassword.jsx
// Primer ingreso con contraseña temporal (recibida por correo): hay que definir una propia antes de usar el panel.
import React, { useState } from 'react';
import AuthShell from '../../components/auth/AuthShell';
import AuthField from '../../components/auth/AuthField';
import PasswordStrength, { passwordValid } from '../../components/auth/PasswordStrength';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { changePassword } from '../../services/api';

export default function ForceChangePassword() {
  const { user, refresh, signOut } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const mismatch = confirm && next !== confirm ? 'Las contraseñas no coinciden' : '';
  const valid = current && passwordValid(next) && next === confirm;

  async function onSubmit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError('');
    try {
      await changePassword(current, next);
      toast.success('Contraseña actualizada. ¡Bienvenido!');
      await refresh(); // el usuario ya no tiene la marca de contraseña temporal → entra al panel
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Crea tu contraseña"
      subtitle={`Hola, ${user.name.split(' ')[0]}. Por seguridad, cambia la contraseña temporal que recibiste por correo antes de continuar.`}
      footer={<button type="button" className="auth-linkbtn" onClick={signOut}>Cerrar sesión</button>}
    >
      <form onSubmit={onSubmit} noValidate>
        <AuthField label="Contraseña temporal" icon="lock" type="password" autoComplete="current-password"
          value={current} onChange={(e) => { setCurrent(e.target.value); setError(''); }} required autoFocus />
        <AuthField label="Nueva contraseña" icon="lock" type="password" autoComplete="new-password"
          value={next} onChange={(e) => { setNext(e.target.value); setError(''); }} required />
        <PasswordStrength value={next} />
        <AuthField label="Confirmar contraseña" icon="lock" type="password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch} required />
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={!valid || busy}>
          {busy ? <span className="auth-spinner" /> : 'Guardar y entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
