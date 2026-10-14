// components/StatusBadge.jsx
// Badge resuelto/pendiente — misma forma (solo las etiquetas cambian) entre
// la columna "Estado" de Conversaciones Recientes (Dashboard) y Escalamientos.
import React from 'react';

export default function StatusBadge({ ok, okLabel, badLabel }) {
  return (
    <span className={`status-badge ${ok ? 'resolved' : 'escalated'}`}>
      {ok ? okLabel : badLabel}
    </span>
  );
}
