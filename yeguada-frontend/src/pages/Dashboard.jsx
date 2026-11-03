// pages/Dashboard.jsx
import React, { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import KpiCard from '../components/Kpicard';
import Icon from '../components/Icon';
import Pagination from '../components/Pagination';
import UserCell from '../components/UserCell';
import StatusBadge from '../components/StatusBadge';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { formatDateTime } from '../utils/format';
import { intentLabel } from '../utils/intents';
import EmojiText from '../components/EmojiText';
import { fetchTimeseries, fetchConversationHistory, fetchConversations } from '../services/api';

const PIE_COLORS = ['var(--pie-1)', 'var(--pie-2)', 'var(--pie-3)', 'var(--pie-4)', 'var(--pie-5)', 'var(--pie-6)'];
const CONV_PAGE_SIZE = 10;

export default function Dashboard({ metrics }) {
  const { user } = useAuth();
  const [range, setRange] = useState('week');
  const [timeseries, setTimeseries] = useState({ week: [], month: [] });
  const [selectedSession, setSelectedSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [convPage, setConvPage] = useState(1);
  const [convItems, setConvItems] = useState([]);
  const [convTotal, setConvTotal] = useState(0);
  const [convTotalPages, setConvTotalPages] = useState(1);
  const [convLoading, setConvLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations({ page: convPage, pageSize: CONV_PAGE_SIZE });
      setConvItems(data.items);
      setConvTotal(data.total);
      setConvTotalPages(data.totalPages);
    } catch { /* backend offline — deja los datos anteriores */ } finally {
      setConvLoading(false);
    }
  }, [convPage]);

  useLiveRefresh(loadConversations);

  async function openDetails(sessionId) {
    setSelectedSession(sessionId);
    setLoadingHistory(true);
    try {
      setHistory(await fetchConversationHistory(sessionId));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  function closeDetails() {
    setSelectedSession(null);
    setHistory([]);
  }

  const loadTimeseries = useCallback(async () => {
    try { setTimeseries(await fetchTimeseries()); } catch { /* backend offline — deja los datos anteriores */ }
  }, []);

  useLiveRefresh(loadTimeseries);

  const chartData = range === 'week' ? timeseries.week : timeseries.month;

  // Build pie data from intentCounts
  // Top 5 intenciones + "Otras": más de ~6 rebanadas no se leen ni se distinguen.
  const sorted = Object.entries(metrics.intentCounts || {})
    .map(([k, v]) => ({ name: intentLabel(k), value: v }))
    .sort((a, b) => b.value - a.value);
  const rest = sorted.slice(5).reduce((sum, d) => sum + d.value, 0);
  const pieData = rest > 0 ? [...sorted.slice(0, 5), { name: 'Otras', value: rest }] : sorted;

  const avgSec = (metrics.avgResponseTimeMs / 1000).toFixed(1);

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {user?.name?.split(' ')[0]}<span className="emoji-wave"><EmojiText text="👋" /></span></h1>
          <div className="page-sub">Así va el rendimiento del chatbot en tiempo real</div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stat-strip">
        <KpiCard icon="chat" label="Total de Chats Hoy" value={metrics.totalChatsToday} sub="↑ 12% vs ayer" />
        <KpiCard icon="check" label="Tasa de Resolución" value={`${metrics.resolutionRate}%`} sub="↑ 3% esta semana" />
        <KpiCard icon="users" tone="gold" label="Escalados a Humano" value={`${metrics.escalationRate}%`} sub="↓ 1% vs semana pasada" />
        <KpiCard icon="clock" tone="gray" label="Tiempo Prom. Respuesta" value={`${avgSec}s`} sub="node-nlp local" />
      </div>

      {/* Charts Row */}
      <div className="chart-row">
        {/* Line Chart */}
        <div className="panel panel-pad">
          <div className="panel-head">
            <span className="panel-title">Volumen de Chats — Chatbot vs. Humano</span>
            <div className="segmented">
              {['week', 'month'].map(r => (
                <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
                  {r === 'week' ? 'Última semana' : 'Este mes'}
                </button>
              ))}
            </div>
          </div>

          <div className="legend-row">
            {[{ label: 'Chatbot', color: 'var(--chart-bot)' }, { label: 'Humano', color: 'var(--chart-hum)' }].map(l => (
              <div key={l.label} className="legend-item">
                <span className="legend-swatch" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="gBot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--chart-bot)' }} stopOpacity={0.3} />
                  <stop offset="100%" style={{ stopColor: 'var(--chart-bot)' }} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--chart-hum)' }} stopOpacity={0.25} />
                  <stop offset="100%" style={{ stopColor: 'var(--chart-hum)' }} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="var(--fill-2)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ stroke: 'var(--fill-3)' }} contentStyle={{ fontSize: 13, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-sans)', background: 'var(--surface)', color: 'var(--text)' }} />
              <Area type="monotone" dataKey="chatbot" stroke="var(--chart-bot)" strokeWidth={2.5} fill="url(#gBot)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="humano" stroke="var(--chart-hum)" strokeWidth={2.5} fill="url(#gHum)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="panel panel-pad">
          <div className="panel-title" style={{ marginBottom: 12 }}>Principales intenciones</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={64} outerRadius={96} dataKey="value" paddingAngle={3} cornerRadius={6} stroke="var(--surface)" strokeWidth={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: 'var(--text-sec)' }}>{v}</span>} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)' }} />
              <Tooltip contentStyle={{ fontSize: 13, borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-md)', fontFamily: 'var(--font-sans)', background: 'var(--surface)', color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="panel panel-pad">
        <div className="panel-title" style={{ marginBottom: 12 }}>Conversaciones Recientes</div>
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                {['Usuario', 'Inicio', 'Intención', 'Score NLP', 'Estado', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!convLoading && convItems.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state">Sin conversaciones registradas todavía.</div></td></tr>
              )}
              {convItems.map((c, i) => (
                <tr key={i}>
                  <td className="cell-main"><UserCell sessionId={c.sessionId} /></td>
                  <td data-label="Inicio" className="mono" style={{ color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>{formatDateTime(c.time)}</td>
                  <td data-label="Intención"><span className="tag tag-accent">{c.intent || '—'}</span></td>
                  <td data-label="Score NLP">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ maxWidth: 60, flex: 1 }}>
                        <div className="progress-fill" style={{ '--fill': c.score || 0, background: c.score >= 0.7 ? 'var(--accent)' : 'var(--warning)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-sec)' }}>{Math.round((c.score || 0) * 100)}%</span>
                    </div>
                  </td>
                  <td data-label="Estado"><StatusBadge ok={c.resolved} okLabel="Chatbot" badLabel="Humano" /></td>
                  <td className="cell-actions">
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => openDetails(c.sessionId)}>
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={convPage} totalPages={convTotalPages} total={convTotal} onPageChange={setConvPage} disabled={convLoading} />
      </div>

      {/* Modal — historial de la sesión */}
      {selectedSession && (
        <div className="drawer-overlay active" onClick={closeDetails} style={{ zIndex: 60, background: 'rgba(10, 11, 13, 0.14)' }}>
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 'min(480px, 92vw)', maxHeight: '80vh',
              display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="panel-title">Historial de conversación</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-ter)' }}>{selectedSession}</div>
              </div>
              <button className="icon-btn" onClick={closeDetails} aria-label="Cerrar">
                <Icon name="close" size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingHistory && <div className="loading-state"><div className="spinner" /></div>}
              {!loadingHistory && history.length === 0 && (
                <div className="empty-state">Sin mensajes para esta sesión.</div>
              )}
              {!loadingHistory && history.map((h, i) => {
                const time = formatDateTime(h.time, { withYear: false });
                return (
                  <React.Fragment key={i}>
                    <div className="chat-msg-row user">
                      <div className="chat-bubble user">{h.message}</div>
                      <div className="chat-time">{time}</div>
                    </div>
                    <div className="chat-msg-row bot">
                      <div className="chat-bubble bot"><EmojiText text={h.answer} /></div>
                      <div className="chat-time">{time}</div>
                      {h.intent && h.intent !== 'None' && (
                        <span className="tag tag-accent tag-mono chat-intent-tag">
                          {h.intent} · {Math.round((h.score || 0) * 100)}%
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
