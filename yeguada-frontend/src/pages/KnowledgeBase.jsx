// pages/KnowledgeBase.jsx
import React, { useState } from 'react';
import { KB_ENTRIES } from '../services/api';

export default function KnowledgeBase() {
  const [entries, setEntries] = useState(KB_ENTRIES);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '', tags: '' });

  const filtered = entries.filter(e =>
    e.question.toLowerCase().includes(search.toLowerCase()) ||
    e.answer.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  function handleAdd() {
    if (!form.question.trim() || !form.answer.trim()) return;
    setEntries(prev => [...prev, {
      id: Date.now(),
      intent: 'custom',
      question: form.question,
      answer: form.answer,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }]);
    setForm({ question: '', answer: '', tags: '' });
    setAdding(false);
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s var(--ease)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Base de Conocimiento de Respuestas</h1>
        <button
          onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-mid)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--forest)'}
        >
          + Agregar Entrada
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>⌕</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en la base de conocimiento..."
          style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 10px 9px 34px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--card)' }}
        />
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 14, animation: 'fadeUp 0.2s var(--ease)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Nueva Entrada</div>
          {[
            { key: 'question', label: 'Pregunta / Consulta', placeholder: '¿Cómo cancelo mi reserva?' },
            { key: 'answer',   label: 'Respuesta del chatbot', placeholder: 'Para cancelar su reserva...' },
            { key: 'tags',     label: 'Etiquetas (separadas por coma)', placeholder: 'cancelación, reserva, reembolso' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--stone)', display: 'block', marginBottom: 4 }}>{f.label}</label>
              <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.key === 'answer' ? 3 : 1}
                style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none', background: 'var(--bg)', resize: 'vertical' }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ padding: '7px 16px', background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setAdding(false)} style={{ padding: '7px 16px', background: 'var(--stone-pale)', color: 'var(--stone)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--stone-mid)', fontSize: 13 }}>
            No se encontraron resultados para "{search}"
          </div>
        )}
        {filtered.map((entry, i) => (
          <div key={entry.id} style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', animation: `fadeUp 0.3s ${i * 0.04}s var(--ease) both`, transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--stone-deep)', marginBottom: 6 }}>
                  {entry.question}
                </div>
                <div style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.6, marginBottom: 10 }}>
                  {entry.answer}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--forest-pale)', color: 'var(--forest)', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button style={{ padding: '4px 10px', fontSize: 11, background: 'var(--stone-pale)', color: 'var(--stone)', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(entry.id)}
                  style={{ padding: '4px 10px', fontSize: 11, background: 'var(--coral-pale)', color: 'var(--coral)', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--stone-mid)', textAlign: 'right' }}>
        {filtered.length} de {entries.length} entradas
      </div>
    </div>
  );
}