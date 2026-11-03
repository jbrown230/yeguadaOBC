// components/Sidebar.jsx
import React from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

// `roles` omitido = visible para todos. Las escrituras también se validan en el backend.
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel de Control',       icon: 'grid' },
  { id: 'intents',   label: 'Intenciones', icon: 'target', roles: ['admin'] },
  { id: 'kb',        label: 'Base de conocimiento',   icon: 'book',   roles: ['admin'] },
  { id: 'escalations', label: 'Escalamientos',         icon: 'users' },
  { id: 'monitor',   label: 'Monitoreo',               icon: 'activity' },
  { id: 'users',     label: 'Usuarios',                icon: 'shield', roles: ['admin'] },
  { id: 'config',    label: 'Configuración',           icon: 'settings', roles: ['admin'] },
];
export const canAccess = (item, role) => !item.roles || item.roles.includes(role);

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { user } = useAuth();
  const navItems = NAV_ITEMS.filter((i) => canAccess(i, user.role));
  return (
    <aside className={`sidebar-root${isOpen ? ' open' : ''}`}>
      <div className="sidebar-close-row">
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar menú">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="sidebar-brand">
        <div className="sidebar-mark">LY</div>
        <div>
          <div className="sidebar-org-name">La Yeguada OBC</div>
          <div className="sidebar-org-sub">Chatbot Admin</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        v1.0.0 · TFG UNA 2026<br />
        node-nlp · WhatsApp API
      </div>
    </aside>
  );
}
