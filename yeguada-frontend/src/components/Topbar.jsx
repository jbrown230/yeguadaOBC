// components/Topbar.jsx
import React from 'react';

const styles = {
  bar: {
    height: 'var(--topbar-height)',
    background: 'var(--forest)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
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
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    color: '#fff',
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
  },
  adminLabel: {
    fontSize: 12,
    opacity: 0.8,
    cursor: 'pointer',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    opacity: 0.75,
  },
  dot: (online) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: online ? '#5DCAA5' : '#E24B4A',
    animation: online ? 'pulse 2s infinite' : 'none',
  }),
};

export default function Topbar({ backendOnline }) {
  return (
    <header style={styles.bar}>
      <div style={styles.brand}>
        <div style={styles.logoCircle}>LY</div>
        Ecoturismo La Yeguada OBC
      </div>

      <div style={styles.right}>
        <div style={styles.statusPill}>
          <div style={styles.dot(backendOnline)} />
          {backendOnline ? 'Backend conectado' : 'Modo demo'}
        </div>

        <button style={styles.notifBtn}>
          ◌
          <span style={styles.badge}>1</span>
        </button>

        <div style={styles.avatar}>AD</div>
        <span style={styles.adminLabel}>Administrador ▾</span>
      </div>
    </header>
  );
}