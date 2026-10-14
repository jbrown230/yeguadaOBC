// pages/Escalations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchEscalations, markEscalationHandled } from '../services/api';
import Pagination from '../components/Pagination';
import UserCell from '../components/UserCell';
import StatusBadge from '../components/StatusBadge';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { formatDateTime } from '../utils/format';

const PAGE_SIZE = 20;

export default function Escalations() {
  const [view, setView] = useState('pending'); // 'pending' | 'all'
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [handlingId, setHandlingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchEscalations({ all: view === 'all', page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      setError('No se pudo cargar los escalamientos — ¿el backend está corriendo?');
    } finally {
      setLoading(false);
    }
  }, [view, page]);

  // Solo al navegar (no en cada refresco de fondo de useLiveRefresh) — mismo
  // efecto visible que antes, sin mostrar el spinner en el sondeo cada 30s.
  useEffect(() => { setLoading(true); }, [view, page]);
  useLiveRefresh(load);

  // setView + setPage en el mismo handler se agrupan en un solo re-render
  // (React 18 agrupa automáticamente) — load() ve view y page nuevos a la
  // vez, así que nunca pide la página vieja en la pestaña nueva.
  function changeView(v) {
    setView(v);
    setPage(1);
  }

  async function handleMark(id) {
    setHandlingId(id);
    try {
      await markEscalationHandled(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setHandlingId(null);
    }
  }

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Escalamientos a Humano</h1>
          <div className="page-sub">
            {view === 'pending'
              ? `${total} conversación${total === 1 ? '' : 'es'} esperando seguimiento`
              : `${total} conversación${total === 1 ? '' : 'es'} en el historial`}
          </div>
        </div>
        <div className="segmented">
          {['pending', 'all'].map((v) => (
            <button key={v} className={view === v ? 'active' : ''} onClick={() => changeView(v)}>
              {v === 'pending' ? 'Pendientes' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div>}

      <div className="panel panel-pad">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['Usuario', 'Canal', 'Mensaje', 'Intención', 'Hora', 'Estado', 'Acciones'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    {view === 'pending' ? '🎉 Sin escalamientos pendientes.' : 'Sin escalamientos registrados todavía.'}
                  </div>
                </td></tr>
              )}
              {items.map((c) => (
                <tr key={c.id}>
                  <td><UserCell sessionId={c.sessionId} /></td>
                  <td><span className="tag tag-mono">{c.channel}</span></td>
                  <td style={{ maxWidth: 280, color: 'var(--text-sec)' }}>{c.message}</td>
                  <td><span className="tag tag-accent">{c.intent || '—'}</span></td>
                  <td className="mono" style={{ color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>{formatDateTime(c.time)}</td>
                  <td><StatusBadge ok={c.handled} okLabel="Atendido" badLabel="Pendiente" /></td>
                  <td>
                    {!c.handled && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleMark(c.id)}
                        disabled={handlingId === c.id}
                      >
                        {handlingId === c.id ? 'Marcando…' : 'Marcar como atendido'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} disabled={loading} />
      </div>
    </div>
  );
}
