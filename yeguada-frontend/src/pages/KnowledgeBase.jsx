// pages/KnowledgeBase.jsx — base de conocimiento. La edición ocurre en un panel (Sheet).
import { useState, useEffect } from 'react';
import { fetchKb, createKbEntry, updateKbEntry, deleteKbEntry, fetchIntents } from '../services/api';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import Sheet from '../components/Sheet';
import ChipInput from '../components/ChipInput';
import EmojiText, { hasEmoji } from '../components/EmojiText';
import { usePagination } from '../hooks/usePagination';
import { useCrudList } from '../hooks/useCrudList';

const EMPTY_FORM = { intentId: '', question: '', answer: '', tags: [] };
const PAGE_SIZE = 5;

export default function KnowledgeBase() {
  const {
    items: entries, loading, error, adding, editingId, form, setField, errors, saving,
    startAdd, startEdit, requestClose, handleSave, handleDelete,
  } = useCrudList({
    fetchFn: fetchKb,
    createFn: createKbEntry,
    updateFn: updateKbEntry,
    deleteFn: deleteKbEntry,
    emptyForm: EMPTY_FORM,
    toForm: (entry) => ({ intentId: entry.intent_id || '', question: entry.question, answer: entry.answer, tags: [...entry.tags] }),
    toPayload: (f) => ({ intentId: f.intentId || null, question: f.question.trim(), answer: f.answer.trim(), tags: f.tags }),
    validate: (f) => ({
      question: f.question.trim() ? '' : 'Escribe la pregunta',
      answer: f.answer.trim() ? '' : 'Escribe la respuesta',
    }),
    loadErrorMessage: 'No se pudo cargar la base de conocimiento — ¿el backend está corriendo?',
    messages: { created: 'Entrada creada', updated: 'Entrada actualizada', deleted: 'Entrada eliminada' },
  });

  // Intenciones para el selector — dependencia de solo lectura
  const [intents, setIntents] = useState([]);
  useEffect(() => { fetchIntents().then(setIntents).catch(() => {}); }, []);

  const [search, setSearch] = useState('');
  const q = search.toLowerCase();
  const filtered = entries.filter((e) =>
    e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)));
  const { page, totalPages, setPage, pageItems } = usePagination(filtered, PAGE_SIZE);

  const askDelete = (entry) => handleDelete(entry, {
    title: '¿Eliminar esta entrada?',
    message: <>“{entry.question}”{entry.intent_id ? ' dejará de usarse para entrenar al chatbot y el modelo se reentrenará.' : ' se borrará de la base de conocimiento.'} Esta acción no se puede deshacer.</>,
  });

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Base de conocimiento</h1>
          <div className="page-sub">Preguntas y respuestas. Las que tienen una intención asociada también entrenan al chatbot.</div>
        </div>
        <button className="btn btn-primary" onClick={() => startAdd({ intentId: intents[0]?.id || '' })}>
          <Icon name="plus" size={15} />
          Nueva entrada
        </button>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

      <div className="search-field" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} />
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en la base de conocimiento…" aria-label="Buscar" />
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stack-list">
            {filtered.length === 0 && (
              <div className="empty-state">
                {search ? <>No se encontraron resultados para “{search}”.</> : <>Aún no hay entradas.<br /><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => startAdd({ intentId: intents[0]?.id || '' })}>Crear la primera</button></>}
              </div>
            )}
            {pageItems.map((entry) => (
              <article key={entry.id} className="panel panel-pad item-card">
                <button className="item-card-main" onClick={() => startEdit(entry)} aria-label={`Editar: ${entry.question}`}>
                  <span className="item-card-title">{entry.question}</span>
                  <span className="item-card-text"><EmojiText text={entry.answer} /></span>
                  <span className="item-card-chips">
                    {entry.intent_id && <span className="tag tag-mono">{entry.intent_id}</span>}
                    {entry.tags.map((tag) => <span key={tag} className="tag tag-accent">{tag}</span>)}
                  </span>
                </button>
                <div className="item-card-foot">
                  <span />
                  <div className="item-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(entry)}><Icon name="edit" size={14} /> Editar</button>
                    <button className="icon-btn danger" onClick={() => askDelete(entry)} aria-label="Eliminar entrada" title="Eliminar"><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length > 0 && <div className="list-count">{filtered.length} de {entries.length} entradas</div>}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Sheet
        open={adding}
        title={editingId ? 'Editar entrada' : 'Nueva entrada'}
        subtitle="Una pregunta frecuente y su respuesta."
        onClose={requestClose}
        formId="kb-form"
        onSubmit={handleSave}
        submitting={saving}
        submitLabel={editingId ? 'Guardar cambios' : 'Crear entrada'}
      >
        <div className="field">
          <label className="field-label" htmlFor="kb-intent">Intención relacionada</label>
          <select id="kb-intent" className="input" value={form.intentId} onChange={(e) => setField('intentId', e.target.value)}>
            <option value="">Sin intención (solo referencia)</option>
            {intents.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {form.intentId && <p className="field-hint">La pregunta se usará para entrenar la intención <strong>{form.intentId}</strong> al guardar.</p>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="kb-question">Pregunta</label>
          <textarea id="kb-question" className="textarea" rows={2} value={form.question} onChange={(e) => setField('question', e.target.value)}
            placeholder="¿Cómo cancelo mi reserva?" aria-invalid={!!errors.question} />
          {errors.question && <p className="field-error">{errors.question}</p>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="kb-answer">Respuesta</label>
          <textarea id="kb-answer" className="textarea" rows={7} value={form.answer} onChange={(e) => setField('answer', e.target.value)}
            placeholder="Para cancelar su reserva…" aria-invalid={!!errors.answer} />
          {errors.answer && <p className="field-error">{errors.answer}</p>}
          {hasEmoji(form.answer) && (
            <div className="answer-preview"><span className="answer-preview-label">Vista previa</span><EmojiText text={form.answer} /></div>
          )}
        </div>

        <div className="field">
          <label className="field-label">Etiquetas</label>
          <ChipInput value={form.tags} onChange={(v) => setField('tags', v)} placeholder="cancelación, reserva… (Enter para agregar)" ariaLabel="Agregar etiqueta" />
        </div>
      </Sheet>
    </div>
  );
}
