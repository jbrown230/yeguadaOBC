// pages/KnowledgeBase.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchKb, createKbEntry, updateKbEntry, deleteKbEntry, fetchIntents } from '../services/api';
import Icon from '../components/Icon';

const EMPTY_FORM = { intentId: '', question: '', answer: '', tags: '' };

export default function KnowledgeBase() {
  const [entries, setEntries] = useState([]);
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [kb, intentList] = await Promise.all([fetchKb(), fetchIntents()]);
      setEntries(kb);
      setIntents(intentList);
      setError(null);
    } catch {
      setError('No se pudo cargar la base de conocimiento — ¿el backend está corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) =>
    e.question.toLowerCase().includes(search.toLowerCase()) ||
    e.answer.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function startAdd() {
    setForm({ ...EMPTY_FORM, intentId: intents[0]?.id || '' });
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(entry) {
    setForm({ intentId: entry.intent_id || '', question: entry.question, answer: entry.answer, tags: entry.tags.join(', ') });
    setEditingId(entry.id);
    setAdding(true);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) return;
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    setSaving(true);
    try {
      const payload = { intentId: form.intentId || null, question: form.question, answer: form.answer, tags };
      if (editingId) {
        await updateKbEntry(editingId, payload);
      } else {
        await createKbEntry(payload);
      }
      await load();
      cancelForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteKbEntry(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Base de Conocimiento</h1>
          <div className="page-sub">Pares de pregunta y respuesta — las que tienen una intención asociada también entrenan al chatbot</div>
        </div>
        <button className="btn btn-primary" onClick={startAdd}>
          <Icon name="plus" size={15} />
          Agregar Entrada
        </button>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

      {/* Search */}
      <div className="search-field" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} />
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en la base de conocimiento..."
        />
      </div>

      {/* Formulario de alta/edición */}
      {adding && (
        <div className="panel panel-pad" style={{ marginBottom: 16 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            {editingId ? 'Editar Entrada' : 'Nueva Entrada'}
          </div>
          <div className="field">
            <label className="field-label">Intención relacionada</label>
            <select className="input" value={form.intentId} onChange={(e) => setForm((p) => ({ ...p, intentId: e.target.value }))}>
              <option value="">— Sin intención asociada (solo referencia) —</option>
              {intents.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.id})</option>
              ))}
            </select>
            {form.intentId && (
              <p style={{ fontSize: 11.5, color: 'var(--text-sec)', marginTop: 6 }}>
                Esta pregunta se agregará como frase de entrenamiento de <strong>{form.intentId}</strong> al guardar.
              </p>
            )}
          </div>
          {[
            { key: 'question', label: 'Pregunta / Consulta', placeholder: '¿Cómo cancelo mi reserva?' },
            { key: 'answer', label: 'Respuesta', placeholder: 'Para cancelar su reserva...' },
            { key: 'tags', label: 'Etiquetas (separadas por coma)', placeholder: 'cancelación, reserva, reembolso' },
          ].map((f) => (
            <div key={f.key} className="field">
              <label className="field-label">{f.label}</label>
              <textarea className="textarea" value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.key === 'answer' ? 3 : 1}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? (form.intentId ? 'Guardando y reentrenando…' : 'Guardando…') : 'Guardar'}
            </button>
            <button className="btn btn-secondary" onClick={cancelForm} disabled={saving}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <>
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
                      {entry.intent_id && <span className="tag tag-mono">{entry.intent_id}</span>}
                      {entry.tags.map((tag) => (
                        <span key={tag} className="tag tag-accent">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(entry)} aria-label="Editar entrada">
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
        </>
      )}
    </div>
  );
}
