// components/Settings.jsx — piezas de las pantallas de ajustes (estilo lista agrupada)
import React from 'react';

// Navegación lateral (se vuelve un control segmentado en pantallas angostas) + contenido
export function SettingsLayout({ title, subtitle, tabs, active, onChange, children }) {
  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="page-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={title}>
          {tabs.map((t) => (
            <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="settings-content" key={active}>{children}</div>
      </div>
    </div>
  );
}

// Grupo con título opcional; las filas hijas se separan con líneas finas
export function Group({ title, note, children }) {
  return (
    <section className="settings-group">
      {title && <h2 className="settings-group-title">{title}</h2>}
      <div className="settings-card">{children}</div>
      {note && <p className="settings-note">{note}</p>}
    </section>
  );
}

// Fila: etiqueta (+ descripción) a la izquierda, control o valor a la derecha
export function Row({ label, desc, children, stack = false }) {
  return (
    <div className={`settings-row${stack ? ' stack' : ''}`}>
      <div className="settings-row-text">
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      {children !== undefined && <div className="settings-row-control">{children}</div>}
    </div>
  );
}

export function Status({ ok, children }) {
  return (
    <span className={`status-pill ${ok ? 'ok' : 'off'}`}>
      <span className={`status-dot ${ok ? 'on' : 'off'}`} />
      {children}
    </span>
  );
}
