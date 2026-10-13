// pages/Escalations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchEscalations, markEscalationHandled } from '../services/api';
import Pagination from '../components/Pagination';

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

  const load = useCallback(async (v, p) => {
    try {
      const data = await fetchEscalations({ all: v === 'all', page: p, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      setError('No se pudo cargar los escalamientos — ¿el backend está corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setPage(1); }, [view]);
  useEffect(() => { setLoading(true); load(view, page); }, [view, page, load]);

  useEffect(() => {
    const handler = () => load(view, page);
    const interval = setInterval(handler, 30000);
    window.addEventListener('yeguada:metrics:updated', handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yeguada:metrics:updated', handler);
    };
  }, [view, page, load]);

  async function handleMark(id) {
    setHandlingId(id);
    try {
      await markEscalationHandled(id);
      await load(view, page);
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
            <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
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
              {items.map((c) => {
                const time = new Date(c.time).toLocaleString('es', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="row-avatar">{(c.sessionId || 'U').slice(0, 2).toUpperCase()}</div>
                        <span style={{ color: 'var(--text)' }}>{c.sessionId}</span>
                      </div>
                    </td>
                    <td><span className="tag tag-mono">{c.channel}</span></td>
                    <td style={{ maxWidth: 280, color: 'var(--text-sec)' }}>{c.message}</td>
                    <td><span className="tag tag-accent">{c.intent || '—'}</span></td>
                    <td className="mono" style={{ color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>{time}</td>
                    <td>
                      <span className={`status-badge ${c.handled ? 'resolved' : 'escalated'}`}>
                        {c.handled ? 'Atendido' : 'Pendiente'}
                      </span>
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} disabled={loading} />
      </div>
    </div>
  );
}
