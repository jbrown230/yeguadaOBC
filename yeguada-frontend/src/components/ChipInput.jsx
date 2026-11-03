// components/ChipInput.jsx — lista de etiquetas/frases: Enter o coma para agregar, × para quitar.
// Con muchas frases se compacta: muestra las primeras y un botón "Ver todas" / "Ver menos".
import React, { useState } from 'react';
import Icon from './Icon';

const COLLAPSED_COUNT = 6;

export default function ChipInput({ value, onChange, placeholder, ariaLabel, invalid, collapsedCount = COLLAPSED_COUNT }) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const overflow = value.length - collapsedCount;
  const collapsed = overflow > 0 && !expanded;
  const visible = collapsed ? value.slice(0, collapsedCount) : value;

  function commit(text) {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((p) => { if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p); });
    onChange(next);
    setDraft('');
    if (next.length > collapsedCount) setExpanded(true); // que se vea lo recién agregado
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(draft); }
    else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
  }

  return (
    <div className={`chip-input${invalid ? ' invalid' : ''}${expanded && overflow > 0 ? ' expanded' : ''}`}>
      {visible.map((chip) => (
        <span key={chip} className="chip">
          <span className="chip-text">{chip}</span>
          <button type="button" onClick={() => onChange(value.filter((v) => v !== chip))} aria-label={`Quitar ${chip}`}>
            <Icon name="close" size={11} strokeWidth={2.6} />
          </button>
        </span>
      ))}
      {overflow > 0 && (
        <button type="button" className="chip-toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          {collapsed ? `Ver todas (+${overflow})` : 'Ver menos'}
        </button>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}  // no se pierde lo escrito al tocar "Guardar"
        placeholder={value.length ? '' : placeholder}
        aria-label={ariaLabel}
        enterKeyHint="done"
      />
    </div>
  );
}
