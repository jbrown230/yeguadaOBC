// pages/Intents.jsx — gestión de intenciones. La edición ocurre en un panel (Sheet) siempre visible.
import { fetchIntents, createIntent, updateIntent, deleteIntent } from '../services/api';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import Sheet from '../components/Sheet';
import ChipInput from '../components/ChipInput';
import ExampleChips from '../components/ExampleChips';
import EmojiText, { hasEmoji } from '../components/EmojiText';
import { usePagination } from '../hooks/usePagination';
import { useCrudList } from '../hooks/useCrudList';

const EMPTY_FORM = { name: '', answer: '', examples: [] };
const PAGE_SIZE = 6;

export default function Intents({ metrics }) {
  const {
    items: intents, loading, error, adding, editingId, form, setField, errors, saving,
    startAdd, startEdit, requestClose, handleSave, handleDelete,
  } = useCrudList({
    fetchFn: fetchIntents,
    createFn: createIntent,
    updateFn: updateIntent,
    deleteFn: deleteIntent,
    emptyForm: EMPTY_FORM,
    toForm: (intent) => ({ name: intent.name, answer: intent.answer, examples: [...intent.examples] }),
    toPayload: (f) => ({ name: f.name.trim(), answer: f.answer.trim(), examples: f.examples }),
    validate: (f) => ({
      name: f.name.trim() ? '' : 'Ponle un nombre a la intención',
      examples: f.examples.length ? '' : 'Agrega al menos una frase de ejemplo',
      answer: f.answer.trim() ? '' : 'Escribe la respuesta que dará el bot',
    }),
    loadErrorMessage: 'No se pudo cargar las intenciones — ¿el backend está corriendo?',
    messages: {
      created: 'Intención creada. El modelo se reentrenó.',
      updated: 'Intención actualizada. El modelo se reentrenó.',
      deleted: 'Intención eliminada. El modelo se reentrenó.',
    },
  });

  const intentCounts = metrics?.intentCounts || {};
  const { page, totalPages, setPage, pageItems } = usePagination(intents, PAGE_SIZE);

  const askDelete = (intent) => handleDelete(intent, {
    title: `¿Eliminar “${intent.name}”?`,
    message: 'Se borrarán sus frases y su respuesta, y el modelo se reentrenará. Las entradas de la base de conocimiento asociadas quedarán sin intención. Esta acción no se puede deshacer.',
  });

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Intenciones</h1>
          <div className="page-sub">{intents.length} intenciones que el chatbot sabe reconocer</div>
        </div>
        <button className="btn btn-primary" onClick={() => startAdd()}>
          <Icon name="plus" size={15} />
          Nueva intención
        </button>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <>
          {intents.length === 0 && !error && (
            <div className="empty-state">
              Aún no hay intenciones.<br />
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => startAdd()}>Crear la primera</button>
            </div>
          )}
          <div className="intent-grid">
            {pageItems.map((intent) => {
              const count = intentCounts[intent.id] || 0;
              return (
                <article key={intent.id} className="panel panel-pad item-card">
                  <button className="item-card-main" onClick={() => startEdit(intent)} aria-label={`Editar ${intent.name}`}>
                    <span className="item-card-head">
                      <span className="item-card-title">{intent.name}</span>
                      <code className="tag tag-mono">{intent.id}</code>
                    </span>
                    <span className="item-card-text"><EmojiText text={intent.answer} /></span>
                  </button>

                  <ExampleChips examples={intent.examples} />

                  <div className="item-card-foot">
                    <span className="item-card-meta">{count} {count === 1 ? 'chat' : 'chats'}</span>
                    <div className="item-card-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(intent)}>
                        <Icon name="edit" size={14} /> Editar
                      </button>
                      <button className="icon-btn danger" onClick={() => askDelete(intent)} aria-label={`Eliminar ${intent.name}`} title="Eliminar">
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Sheet
        open={adding}
        title={editingId ? 'Editar intención' : 'Nueva intención'}
        subtitle={editingId ? editingId : 'Define qué preguntas reconoce y cómo responde el bot.'}
        onClose={requestClose}
        formId="intent-form"
        onSubmit={handleSave}
        submitting={saving}
        submitLabel={editingId ? 'Guardar cambios' : 'Crear intención'}
      >
        <div className="field">
          <label className="field-label" htmlFor="intent-name">Nombre</label>
          <input id="intent-name" className="input" value={form.name} onChange={(e) => setField('name', e.target.value)}
            placeholder="Ej: Solicitud de factura" aria-invalid={!!errors.name} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="intent-answer">Respuesta del bot</label>
          <textarea id="intent-answer" className="textarea" rows={7} value={form.answer} onChange={(e) => setField('answer', e.target.value)}
            placeholder="Puede solicitar su factura escribiéndonos por WhatsApp con el número de su reserva…" aria-invalid={!!errors.answer} />
          {errors.answer && <p className="field-error">{errors.answer}</p>}
          {hasEmoji(form.answer) && (
            <div className="answer-preview"><span className="answer-preview-label">Vista previa</span><EmojiText text={form.answer} /></div>
          )}
        </div>

        <div className="field">
          <label className="field-label">Frases de ejemplo ({form.examples.length})</label>
          <ChipInput value={form.examples} onChange={(v) => setField('examples', v)} invalid={!!errors.examples}
            placeholder="Escribe una frase y presiona Enter" ariaLabel="Agregar frase de ejemplo" />
          {errors.examples
            ? <p className="field-error">{errors.examples}</p>
            : <p className="field-hint">Cómo escribiría un visitante esta consulta. Con 5 o más el bot acierta mejor.</p>}
        </div>

        <p className="field-hint">Al guardar, el modelo se reentrena y los cambios se aplican de inmediato.</p>
      </Sheet>
    </div>
  );
}
