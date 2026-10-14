// components/UserCell.jsx
// Avatar con iniciales + session id — repetido igual en la tabla de
// Conversaciones Recientes (Dashboard) y en Escalamientos.
import React from 'react';

export default function UserCell({ sessionId }) {
  const initials = (sessionId || 'U').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="row-avatar">{initials}</div>
      <span style={{ color: 'var(--text)' }}>{sessionId}</span>
    </div>
  );
}
