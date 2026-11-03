// components/ChangePasswordCard.jsx — cambio de contraseña desde Configuración
import React, { useState } from 'react';
import PasswordStrength, { passwordValid } from './auth/PasswordStrength';
import { changePassword } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ChangePasswordCard() {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); setOk(false); };

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setOk(false);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '' });
      setOk(true);
      toast.success('Contraseña actualizada');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off">
      <div className="fields-2">
        <div className="field">
          <label className="field-label">Contraseña actual</label>
          <input className="input" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} />
        </div>
        <div className="field">
          <label className="field-label">Nueva contraseña</label>
          <input className="input" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} />
        </div>
      </div>
      <PasswordStrength value={form.next} />
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)', margin: '4px 0 14px' }}>
        Al cambiarla se cierran tus otras sesiones abiertas y recibirás un aviso por correo.
      </p>
      {error && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
      {ok && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', marginBottom: 10 }}>Contraseña actualizada.</p>}
      <button className="btn btn-secondary" disabled={busy || !form.current || !passwordValid(form.next)}>
        {busy ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
