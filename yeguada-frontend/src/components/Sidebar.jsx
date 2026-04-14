// components/Sidebar.jsx
import React from 'react';

const navItems = [
  { id: 'dashboard', label: 'Panel de Control',          icon: '▦' },
  { id: 'intents',   label: 'Gestión de Intenciones',    icon: '🎯' },
  { id: 'kb',        label: 'Base de Conocimiento',      icon: '📚' },
  { id: 'monitor',   label: 'Monitoreo',                 icon: '🖥️'  },
  { id: 'config',    label: 'Configuración',             icon: '⚙️'  },
];

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--card)',
    borderRight: '0.5px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
  },
  logoArea: {
    padding: '20px 16px 16px',
    borderBottom: '0.5px solid var(--border)',
    textAlign: 'center',
  },
  logoEmoji: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--forest-pale), var(--teal-pale))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    margin: '0 auto 10px',
    border: '2px solid var(--forest-pale)',
  },
  orgName: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--forest)',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },
  nav: { flex: 1, padding: '10px 0' },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--forest)' : 'var(--stone)',
    background: active ? 'var(--forest-pale)' : 'transparent',
    borderLeft: `3px solid ${active ? 'var(--forest)' : 'transparent'}`,
    transition: 'all 0.15s var(--ease)',
    userSelect: 'none',
  }),
  navIcon: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flexShrink: 0,
  },
  version: {
    padding: '12px 16px',
    borderTop: '0.5px solid var(--border)',
    fontSize: 10,
    color: 'var(--stone-mid)',
    textAlign: 'center',
  },
};

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <div style={styles.logoEmoji}>🏔️</div>
        <div style={styles.orgName}>La Yeguada OBC<br />· Chatbot Admin ·</div>
      </div>

      <nav style={styles.nav}>
        {navItems.map(item => (
          <div
            key={item.id}
            style={styles.navItem(activePage === item.id)}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={e => {
              if (activePage !== item.id) {
                e.currentTarget.style.background = 'var(--stone-pale)';
                e.currentTarget.style.color = 'var(--stone-deep)';
              }
            }}
            onMouseLeave={e => {
              if (activePage !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--stone)';
              }
            }}
          >
            <div style={styles.navIcon}>{item.icon}</div>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={styles.version}>
        v1.0.0 · TFG UNA 2024<br />
        node-nlp · WhatsApp API
      </div>
    </aside>
  );
}