// components/Sidebar.jsx
import React from 'react';
import Icon from './Icon';

const navItems = [
  { id: 'dashboard', label: 'Panel de Control',       icon: 'grid' },
  { id: 'intents',   label: 'Gestión de Intenciones', icon: 'target' },
  { id: 'kb',        label: 'Base de Conocimiento',   icon: 'book' },
  { id: 'monitor',   label: 'Monitoreo',               icon: 'activity' },
  { id: 'config',    label: 'Configuración',           icon: 'settings' },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
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
        v1.0.0 · TFG UNA 2024<br />
        node-nlp · WhatsApp API
      </div>
    </aside>
  );
}
