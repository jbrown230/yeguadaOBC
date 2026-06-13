// components/Topbar.jsx
import React from 'react';

const styles = {
  bar: {
    height: 'var(--topbar-height)',
    background: 'var(--forest)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '0.01em',
    minWidth: 0,
  },
  brandText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--forest-mid)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.02em',
    flexShrink: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#fff',
    flexShrink: 0,
  },
  notifBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 18,
    padding: '4px',
    cursor: 'pointer',
    opacity: 0.85,
    lineHeight: 1,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    background: '#E24B4A',
    borderRadius: '50%',
    fontSize: 9,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    border: '1.5px solid var(--forest)',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--forest-mid)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  adminLabel: {
    fontSize: 12,
    opacity: 0.8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    opacity: 0.75,
    whiteSpace: 'nowrap',
  },
  dot: (online) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: online ? '#5DCAA5' : '#E24B4A',
    animation: online ? 'pulse 2s infinite' : 'none',
    flexShrink: 0,
  }),
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    padding: '4px 6px',
    cursor: 'pointer',
    lineHeight: 1,
    opacity: 0.9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
};

export default function Topbar({ backendOnline, onMenuToggle, onChatToggle }) {
  return (
    <header style={styles.bar}>
      <div style={styles.brand}>
        <button className="btn-menu" style={styles.iconBtn} onClick={onMenuToggle} aria-label="Abrir menú">
          ☰
        </button>
        <div style={styles.logoCircle}>LY</div>
        <span style={styles.brandText}>Ecoturismo La Yeguada OBC</span>
      </div>

      <div style={styles.right}>
        <div className="topbar-status" style={styles.statusPill}>
          <div style={styles.dot(backendOnline)} />
          {backendOnline ? 'Backend conectado' : 'Modo demo'}
        </div>

        <button className="topbar-notif" style={styles.notifBtn}>
          ◌
          <span style={styles.badge}>1</span>
        </button>

        <div style={styles.avatar}>AD</div>
        <span className="topbar-admin" style={styles.adminLabel}>Administrador ▾</span>

        <button className="btn-chat" style={styles.iconBtn} onClick={onChatToggle} aria-label="Abrir chat">
          <span style={styles.chatBtnLabel}>Chat</span>
        </button>
      </div>
    </header>
  );
}
