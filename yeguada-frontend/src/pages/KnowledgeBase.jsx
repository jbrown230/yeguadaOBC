// pages/KnowledgeBase.jsx
import React, { useState } from 'react';
import { KB_ENTRIES } from '../services/api';
import Icon from '../components/Icon';

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
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Base de Conocimiento</h1>
          <div className="page-sub">Pares de pregunta y respuesta que alimentan al chatbot</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} />
          Agregar Entrada
        </button>
      </div>

      {/* Search */}
      <div className="search-field" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} />
        <input
          className="input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en la base de conocimiento..."
        />
      </div>

      {/* Add form */}
      {adding && (
        <div className="panel panel-pad" style={{ marginBottom: 16 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>Nueva Entrada</div>
          {[
            { key: 'question', label: 'Pregunta / Consulta', placeholder: '¿Cómo cancelo mi reserva?' },
            { key: 'answer',   label: 'Respuesta del chatbot', placeholder: 'Para cancelar su reserva...' },
            { key: 'tags',     label: 'Etiquetas (separadas por coma)', placeholder: 'cancelación, reserva, reembolso' },
          ].map(f => (
            <div key={f.key} className="field">
              <label className="field-label">{f.label}</label>
              <textarea className="textarea" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.key === 'answer' ? 3 : 1}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdd}>Guardar</button>
            <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div className="empty-state">No se encontraron resultados para "{search}"</div>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="panel panel-pad">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  {entry.question}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 10 }}>
                  {entry.answer}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {entry.tags.map(tag => (
                    <span key={tag} className="tag tag-accent">{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" aria-label="Editar entrada">
                  <Icon name="edit" size={14} />
                </button>
                <button onClick={() => handleDelete(entry.id)} className="btn btn-danger-ghost btn-sm" aria-label="Eliminar entrada">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mono" style={{ marginTop: 14, fontSize: 11, color: 'var(--text-ter)', textAlign: 'right' }}>
        {filtered.length} de {entries.length} entradas
      </div>
    </div>
  );
}
