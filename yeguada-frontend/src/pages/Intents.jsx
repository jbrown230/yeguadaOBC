// pages/Intents.jsx
import React, { useState } from 'react';
import { MOCK_INTENTS } from '../services/api';

const COLORS = ['green', 'teal', 'gold', 'stone', 'coral', 'teal', 'green', 'gold'];
const COLOR_MAP = {
  green: { bg: 'var(--forest-pale)', text: 'var(--forest)', border: 'var(--forest-light)' },
  teal:  { bg: 'var(--teal-pale)',   text: 'var(--teal)',   border: 'var(--teal-light)'   },
  gold:  { bg: 'var(--gold-pale)',   text: 'var(--gold)',   border: 'var(--gold-light)'   },
  stone: { bg: 'var(--stone-pale)',  text: 'var(--stone)',  border: 'var(--stone-mid)'    },
  coral: { bg: 'var(--coral-pale)',  text: 'var(--coral)',  border: 'var(--coral-light)'  },
};

const COUNTS = { 'booking.tour': 52, 'pricing.info': 29, 'guide.availability': 38, 'general.info': 18, 'location.directions': 22, 'camping.info': 12, 'waterfall.info': 10, 'hours.info': 8 };

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
    <div style={{ animation: 'fadeUp 0.3s var(--ease)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Gestión de Intenciones NLP</h1>
        <button
          onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-mid)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--forest)'}
        >
          + Nueva Intención
        </button>
      </div>

      {/* New intent form */}
      {adding && (
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 16, animation: 'fadeUp 0.2s var(--ease)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Nueva Intención</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--stone)', display: 'block', marginBottom: 4 }}>Nombre de la intención</label>
              <input value={newIntent.name} onChange={e => setNewIntent(p => ({ ...p, name: e.target.value }))}
                placeholder="ej: Solicitud de factura"
                style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--stone)', display: 'block', marginBottom: 4 }}>Frases de ejemplo (separadas por coma)</label>
              <input value={newIntent.examples} onChange={e => setNewIntent(p => ({ ...p, examples: e.target.value }))}
                placeholder="quiero una factura, necesito mi recibo, factura del tour"
                style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ padding: '7px 16px', background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setAdding(false)} style={{ padding: '7px 16px', background: 'var(--stone-pale)', color: 'var(--stone)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {intents.map((intent, i) => {
          const color = COLOR_MAP[COLORS[i % COLORS.length]];
          const count = COUNTS[intent.id] || Math.floor(Math.random() * 20 + 5);
          return (
            <div key={intent.id} style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, transition: 'box-shadow 0.15s', animationDelay: `${i * 0.05}s` }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--stone-deep)' }}>{intent.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: color.bg, color: color.text }}>{count} chats</span>
                  <code style={{ fontSize: 10, color: 'var(--stone-mid)', background: 'var(--stone-pale)', padding: '1px 6px', borderRadius: 4 }}>{intent.id}</code>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--stone-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Frases de ejemplo</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {intent.examples.map((ex, j) => (
                    <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--stone-pale)', color: 'var(--stone)', border: '0.5px solid var(--border)' }}>{ex}</span>
                  ))}
                </div>
              </div>

              {/* Score bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--stone-mid)', width: 70 }}>Precisión</div>
                <div style={{ flex: 1, height: 4, background: 'var(--stone-pale)', borderRadius: 2 }}>
                  <div style={{ width: `${85 + Math.floor(Math.random() * 12)}%`, height: '100%', background: color.border, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--stone-mid)', width: 32, textAlign: 'right' }}>
                  {85 + Math.floor(i * 1.5)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}