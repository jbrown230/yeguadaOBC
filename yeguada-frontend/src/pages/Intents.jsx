// pages/Intents.jsx
import React, { useState } from 'react';
import { MOCK_INTENTS } from '../services/api';
import Icon from '../components/Icon';

const COUNTS = { 'booking.tour': 52, 'pricing.info': 29, 'guide.availability': 38, 'general.info': 18, 'location.directions': 22, 'camping.info': 12, 'waterfall.info': 10, 'hours.info': 8 };
const ACCURACY = { 'booking.tour': 94, 'pricing.info': 91, 'guide.availability': 89, 'general.info': 96, 'location.directions': 92, 'camping.info': 88, 'waterfall.info': 90, 'hours.info': 93 };

export default function Intents() {
  const [intents, setIntents] = useState(MOCK_INTENTS);
  const [adding, setAdding] = useState(false);
  const [newIntent, setNewIntent] = useState({ name: '', examples: '' });

  function handleAdd() {
    if (!newIntent.name.trim()) return;
    const id = newIntent.name.toLowerCase().replace(/\s+/g, '.');
    setIntents(prev => [...prev, {
      id,
      name: newIntent.name,
      examples: newIntent.examples.split(',').map(e => e.trim()).filter(Boolean),
    }]);
    setNewIntent({ name: '', examples: '' });
    setAdding(false);
  }

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Gestión de Intenciones NLP</h1>
          <div className="page-sub">{intents.length} intenciones configuradas en el modelo</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} />
          Nueva Intención
        </button>
      </div>

      {/* New intent form */}
      {adding && (
        <div className="panel panel-pad" style={{ marginBottom: 16 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>Nueva Intención</div>
          <div className="fields-2">
            <div className="field">
              <label className="field-label">Nombre de la intención</label>
              <input className="input" value={newIntent.name} onChange={e => setNewIntent(p => ({ ...p, name: e.target.value }))}
                placeholder="ej: Solicitud de factura" />
            </div>
            <div className="field">
              <label className="field-label">Frases de ejemplo (separadas por coma)</label>
              <input className="input" value={newIntent.examples} onChange={e => setNewIntent(p => ({ ...p, examples: e.target.value }))}
                placeholder="quiero una factura, necesito mi recibo, factura del tour" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
            <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="intent-grid">
        {intents.map((intent) => {
          const count = COUNTS[intent.id] || 12;
          const accuracy = ACCURACY[intent.id] || 90;
          return (
            <div key={intent.id} className="panel panel-pad">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{intent.name}</div>
                <code className="tag tag-mono">{intent.id}</code>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="field-label" style={{ marginBottom: 7 }}>Frases de ejemplo</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {intent.examples.map((ex, j) => (
                    <span key={j} className="tag">{ex}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 10.5, color: 'var(--text-ter)', width: 60, flexShrink: 0 }}>Precisión</span>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ '--fill': accuracy / 100, background: 'var(--accent)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-sec)' }}>{accuracy}%</span>
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-ter)', marginLeft: 14 }}>{count} chats</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
