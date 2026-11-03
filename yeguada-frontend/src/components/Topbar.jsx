// components/Topbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

function UserMenu({ onAccount }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <div className="avatar-chip">{initials(user?.name)}</div>
        <span className="admin-label">
          {user?.name?.split(' ')[0]}
          <Icon name="chevronDown" size={13} />
        </span>
      </button>
      {open && (
        <div className="user-menu-pop" role="menu">
          <div className="user-menu-info">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
            <span className="tag tag-accent" style={{ marginTop: 8, alignSelf: 'flex-start' }}>{roleLabel(user?.role)}</span>
          </div>
          <button role="menuitem" className="user-menu-item" onClick={() => { setOpen(false); onAccount(); }}>
            <Icon name="user" size={16} /> Mi cuenta
          </button>
          <button role="menuitem" className="user-menu-item danger" onClick={signOut}>
            <Icon name="logout" size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ backendOnline, onMenuToggle, pendingEscalations = 0, onNotifClick, onAccount }) {
  const { resolved, toggle } = useTheme();
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <button className="btn-menu icon-btn" onClick={onMenuToggle} aria-label="Abrir menú">
          <Icon name="menu" size={18} />
        </button>
        <div className="topbar-mark">LY</div>
        <div style={{ minWidth: 0 }}>
          <div className="topbar-title">Ecoturismo La Yeguada OBC</div>
          <div className="topbar-sub">Panel de administración del chatbot</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="status-chip topbar-status-chip">
          <span className={`status-dot ${backendOnline ? 'on' : 'off'}`} />
          {backendOnline ? 'Backend conectado' : 'Modo demo'}
        </div>

        <button
          className="icon-btn topbar-notif"
          onClick={onNotifClick}
          aria-label={pendingEscalations > 0 ? `${pendingEscalations} escalamientos pendientes` : 'Notificaciones'}
          title={pendingEscalations > 0 ? `${pendingEscalations} escalamientos pendientes` : 'Sin escalamientos pendientes'}
        >
          <Icon name="bell" size={18} />
          {pendingEscalations > 0 && <span className="dot-badge" />}
        </button>

        <button
          className="icon-btn"
          onClick={toggle}
          aria-label={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={resolved === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        <UserMenu onAccount={onAccount} />

      </div>
    </header>
  );
}
