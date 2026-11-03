// components/Sheet.jsx
// Panel de edición: cajón lateral en escritorio, hoja a pantalla completa en celular.
// Cabecera y pie fijos (Guardar/Cancelar siempre a la vista); el contenido se desplaza.
// Los campos van dentro de <form id={formId}> y el botón de guardar del pie usa form={formId}.
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

export default function Sheet({ open, title, subtitle, onClose, formId, onSubmit, submitLabel = 'Guardar', submitting = false, children }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Foco al primer campo, pero no en pantallas táctiles (evita abrir el teclado de golpe)
    if (!window.matchMedia('(pointer: coarse)').matches) {
      bodyRef.current?.querySelector('input:not([type=hidden]), textarea, select')?.focus();
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="sheet-head">
          <div style={{ minWidth: 0 }}>
            <h2 id="sheet-title" className="sheet-title">{title}</h2>
            {subtitle && <p className="sheet-sub">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar editor"><Icon name="close" size={18} /></button>
        </header>

        <form id={formId} onSubmit={onSubmit} noValidate className="sheet-body" ref={bodyRef}>
          {children}
        </form>

        <footer className="sheet-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Guardando…' : submitLabel}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
