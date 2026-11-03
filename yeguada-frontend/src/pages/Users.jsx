// pages/Users.jsx — gestión de usuarios y roles (solo admin)
// El admin no escribe ni ve contraseñas: el sistema genera una temporal y se la envía por correo
// al propio usuario, que debe cambiarla en su primer ingreso.
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { ROLES, roleLabel } from '../utils/roles';
import { formatDateTime } from '../utils/format';
import { fetchUsers, createUser, updateUser, deleteUser, sendUserReset } from '../services/api';

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
const EMPTY = { name: '', email: '', role: 'operador' };

function NewUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(''); };
  const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError('');
    try {
      onCreated(await createUser(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  // Portal al body: .page-enter deja un transform que haría de contenedor de `position: fixed`.
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="new-user-title">
        <div className="modal-head">
          <div>
            <h2 id="new-user-title" className="modal-title">Nuevo usuario</h2>
            <p className="modal-sub">Dale acceso al panel con el rol que necesite.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={16} /></button>
        </div>

        <div className="fields-2">
          <div className="field">
            <label className="field-label" htmlFor="nu-name">Nombre</label>
            <input id="nu-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus autoComplete="off" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="nu-email">Correo</label>
            <input id="nu-email" className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Rol</label>
          <div className="role-cards">
            {Object.entries(ROLES).map(([id, r]) => (
              <button type="button" key={id} className={`role-card${form.role === id ? ' active' : ''}`} onClick={() => set('role', id)}>
                <span className="role-card-title">{r.label}</span>
                <span className="role-card-desc">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="callout">
          <strong>Acceso seguro.</strong> Le enviaremos por correo una contraseña temporal generada automáticamente.
          Tú no la verás y la persona deberá cambiarla en su primer ingreso.
        </div>

        {error && <div className="inline-error" style={{ marginTop: 14 }}>{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid || busy}>{busy ? 'Creando y enviando…' : 'Crear y enviar acceso'}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try { setUsers(await fetchUsers()); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(id, fn, okMsg) {
    setBusyId(id);
    try { const res = await fn(); await load(); if (okMsg) toast.success(okMsg(res)); }
    catch (err) { toast.error(err.message); }
    finally { setBusyId(null); }
  }

  async function askDelete(u) {
    const ok = await confirm({
      title: `¿Eliminar a ${u.name}?`,
      message: 'Perderá el acceso al panel de inmediato. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar usuario', tone: 'danger',
    });
    if (ok) act(u.id, () => deleteUser(u.id), () => `${u.name} fue eliminado.`);
  }

  async function askResend(u) {
    const ok = await confirm({
      title: `¿Reenviar acceso a ${u.name}?`,
      message: `Se generará una nueva contraseña temporal y se enviará a ${u.email}. La contraseña actual dejará de funcionar y se cerrarán sus sesiones abiertas.`,
      confirmLabel: 'Reenviar acceso', tone: 'primary',
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      const r = await sendUserReset(u.id);
      if (r.mailConfigured) toast.success(`Enviamos una nueva contraseña temporal a ${u.email}.`);
      else toast.info('Resend no está configurado: la contraseña temporal se imprimió en la consola del backend.', { duration: 9000 });
    } catch (err) { toast.error(err.message, { duration: 9000 }); }
    finally { setBusyId(null); }
  }

  function onCreated({ user, emailed, mailError, mailConfigured }) {
    setShowNew(false);
    load();
    if (!emailed) toast.error(`Usuario creado, pero no se pudo enviar el correo (${mailError}). Cuando lo resuelvas, usa “Reenviar acceso”.`, { duration: 12000 });
    else if (mailConfigured) toast.success(`Usuario creado. Enviamos la contraseña temporal a ${user.email}.`);
    else toast.info('Usuario creado. Resend no está configurado: la contraseña temporal se imprimió en la consola del backend.', { duration: 9000 });
  }

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <div className="page-sub">{users.length} persona{users.length === 1 ? '' : 's'} con acceso al panel</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" size={16} /> Nuevo usuario</button>
      </div>

      {error && <div className="inline-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="panel panel-pad">
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Último acceso</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4}><div className="empty-state">Cargando…</div></td></tr>}
              {users.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td className="cell-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="row-avatar" style={{ width: 38, height: 38 }}>{initials(u.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{u.name}{isMe && <span className="tag tag-mono" style={{ marginLeft: 8 }}>Tú</span>}</div>
                          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-sec)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Rol">
                      {isMe ? <span className={`tag ${u.role === 'admin' ? 'tag-accent' : ''}`}>{roleLabel(u.role)}</span> : (
                        <select
                          className="select" value={u.role} disabled={busyId === u.id}
                          onChange={(e) => act(u.id, () => updateUser(u.id, { role: e.target.value }), () => `Rol de ${u.name} actualizado a ${roleLabel(e.target.value)}.`)}
                          aria-label={`Rol de ${u.name}`}
                        >
                          {Object.entries(ROLES).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td data-label="Último acceso" style={{ color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : <span className="tag tag-warning">Aún no ingresa</span>}
                    </td>
                    <td className="cell-actions">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, alignItems: 'center' }}>
                        {!isMe && (
                          <>
                            <button className="icon-btn" title="Reenviar acceso (nueva contraseña temporal)" aria-label={`Reenviar acceso a ${u.name}`}
                              disabled={busyId === u.id} onClick={() => askResend(u)}>
                              <Icon name="mail" size={17} />
                            </button>
                            <button className="icon-btn danger" title="Eliminar usuario" aria-label={`Eliminar a ${u.name}`} onClick={() => askDelete(u)}>
                              <Icon name="trash" size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <NewUserModal onClose={() => setShowNew(false)} onCreated={onCreated} />}
    </div>
  );
}
