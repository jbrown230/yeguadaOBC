// components/Pagination.jsx
// Compartido entre listas backed por el backend (Escalamientos, Conversaciones)
// y listas paginadas solo en el cliente (Intenciones, Base de Conocimiento).
import React from 'react';

export default function Pagination({ page, totalPages, onPageChange, disabled = false, total }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        ‹ Anterior
      </button>
      <span className="mono pagination-info">
        Página {page} de {totalPages}{typeof total === 'number' ? ` · ${total} en total` : ''}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Siguiente ›
      </button>
    </div>
  );
}
