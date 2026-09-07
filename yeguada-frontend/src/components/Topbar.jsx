// components/Topbar.jsx
import React from 'react';
import Icon from './Icon';

export default function Topbar({ backendOnline, onMenuToggle, onChatToggle }) {
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

        <button className="icon-btn topbar-notif" aria-label="Notificaciones">
          <Icon name="bell" size={18} />
          <span className="dot-badge" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
          <div className="avatar-chip">AD</div>
          <span className="admin-label">
            Administrador
            <Icon name="chevronDown" size={13} />
          </span>
        </div>

        <button className="btn-chat-toggle icon-btn" onClick={onChatToggle} aria-label="Abrir chat">
          <Icon name="chat" size={18} />
        </button>
      </div>
    </header>
  );
}
