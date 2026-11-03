// components/ExampleChips.jsx — frases de ejemplo en la tarjeta: una sola fila compacta + "Ver todas"
import React, { useState } from 'react';

export default function ExampleChips({ examples, limit = 3 }) {
  const [open, setOpen] = useState(false);
  const extra = examples.length - limit;

  return (
    <div className={`example-chips${open ? ' open' : ''}`}>
      <span className="example-count">{examples.length} {examples.length === 1 ? 'frase' : 'frases'}</span>
      {extra > 0 && (
        <button type="button" className="example-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Ver menos' : 'Ver todas'}
        </button>
      )}
      {examples.map((ex) => <span key={ex} className="tag example-tag" title={ex}>{ex}</span>)}
    </div>
  );
}
