// pages/Intents.jsx
import { fetchIntents, createIntent, updateIntent, deleteIntent } from '../services/api';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { useCrudList } from '../hooks/useCrudList';

const EMPTY_FORM = { name: '', answer: '', examples: '' };
const PAGE_SIZE = 6;

export default function Intents({ metrics }) {
  const {
    items: intents, loading, error, adding, editingId, form, setForm, saving,
    startAdd, startEdit, cancelForm, handleSave, handleDelete,
  } = useCrudList({
    fetchFn: fetchIntents,
    createFn: createIntent,
    updateFn: updateIntent,
    deleteFn: deleteIntent,
    emptyForm: EMPTY_FORM,
    toForm: (intent) => ({ name: intent.name, answer: intent.answer, examples: intent.examples.join(', ') }),
    toPayload: (form) => ({
      name: form.name,
      answer: form.answer,
      examples: form.examples.split(',').map((e) => e.trim()).filter(Boolean),
    }),
    validate: (payload) => payload.name.trim() && payload.answer.trim() && payload.examples.length > 0,
    loadErrorMessage: 'No se pudo cargar las intenciones — ¿el backend está corriendo?',
  });

  const intentCounts = metrics?.intentCounts || {};
  const { page, totalPages, setPage, pageItems } = usePagination(intents, PAGE_SIZE);

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Gestión de Intenciones NLP</h1>
          <div className="page-sub">{intents.length} intenciones configuradas en el modelo</div>
        </div>
        <button className="btn btn-primary" onClick={() => startAdd()}>
          <Icon name="plus" size={15} />
          Nueva Intención
        </button>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

      {/* Formulario de alta/edición */}
      {adding && (
        <div className="panel panel-pad" style={{ marginBottom: 16 }}>
          <div className="panel-title" style={{ marginBottom: 14 }}>
            {editingId ? `Editar: ${editingId}` : 'Nueva Intención'}
          </div>
          <div className="field">
            <label className="field-label">Nombre de la intención</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="ej: Solicitud de factura" />
          </div>
          <div className="field">
            <label className="field-label">Frases de ejemplo (separadas por coma)</label>
            <input className="input" value={form.examples} onChange={(e) => setForm((p) => ({ ...p, examples: e.target.value }))}
              placeholder="quiero una factura, necesito mi recibo, factura del tour" />
          </div>
          <div className="field">
            <label className="field-label">Respuesta del bot</label>
            <textarea className="textarea" rows={3} value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
              placeholder="Puede solicitar su factura escribiéndonos por WhatsApp con el número de su reserva..." />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando y reentrenando…' : 'Guardar'}
            </button>
            <button className="btn btn-secondary" onClick={cancelForm} disabled={saving}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <>
          <div className="intent-grid">
            {pageItems.map((intent) => {
              const count = intentCounts[intent.id] || 0;
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

                  <div style={{ fontSize: 12.5, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 12 }}>
                    {intent.answer}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-ter)' }}>{count} chats</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(intent)} aria-label="Editar intención">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-danger-ghost btn-sm" onClick={() => handleDelete(intent.id)} aria-label="Eliminar intención">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
