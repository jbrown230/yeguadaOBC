// pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import KpiCard from '../components/Kpicard';
import Icon from '../components/Icon';
import { fetchTimeseries, fetchConversationHistory } from '../services/api';

const PIE_COLORS = ['#396B2C', '#FFA700', '#8A5A12', '#7B8190', '#A3312A', '#454A54'];

export default function Dashboard({ metrics }) {
  const [range, setRange] = useState('week');
  const [timeseries, setTimeseries] = useState({ week: [], month: [] });
  const [selectedSession, setSelectedSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  useEffect(() => {
    loadTimeseries();
    const interval = setInterval(loadTimeseries, 30000);
    window.addEventListener('yeguada:metrics:updated', loadTimeseries);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yeguada:metrics:updated', loadTimeseries);
    };
  }, [loadTimeseries]);

  const chartData = range === 'week' ? timeseries.week : timeseries.month;

  // Build pie data from intentCounts
  const intentLabels = {
    'booking.tour':        'Reserva Tours',
    'guide.availability':  'Dispon. Guía',
    'pricing.info':        'Precios',
    'general.info':        'Info General',
    'camping.info':        'Camping',
    'waterfall.info':      'Cascadas',
  };
  const pieData = Object.entries(metrics.intentCounts || {}).map(([k, v]) => ({
    name: intentLabels[k] || k,
    value: v,
  }));

  const avgSec = (metrics.avgResponseTimeMs / 1000).toFixed(1);

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <div className="page-sub">Rendimiento del chatbot en tiempo real</div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stat-strip">
        <KpiCard label="Total de Chats Hoy" value={metrics.totalChatsToday} sub="↑ 12% vs ayer" />
        <KpiCard label="Tasa de Resolución" value={`${metrics.resolutionRate}%`} sub="↑ 3% esta semana" />
        <KpiCard label="Escalados a Humano" value={`${metrics.escalationRate}%`} sub="↓ 1% vs semana pasada" />
        <KpiCard label="Tiempo Prom. Respuesta" value={`${avgSec}s`} sub="node-nlp local" />
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
            {[{ label: 'Chatbot', color: '#396B2C' }, { label: 'Humano', color: '#9CA2AF' }].map(l => (
              <div key={l.label} className="legend-item">
                <span className="legend-swatch" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11.5, borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-sans)' }} />
              <Line type="monotone" dataKey="chatbot" stroke="#396B2C" strokeWidth={2} dot={{ r: 3, fill: '#396B2C', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="humano" stroke="#9CA2AF" strokeWidth={2} dot={{ r: 3, fill: '#9CA2AF', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="panel panel-pad">
          <div className="panel-title" style={{ marginBottom: 12 }}>Principales Intenciones</div>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2} stroke="var(--surface)" strokeWidth={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10.5, fontFamily: 'var(--font-sans)' }} />
              <Tooltip contentStyle={{ fontSize: 11.5, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--font-sans)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="panel panel-pad">
        <div className="panel-title" style={{ marginBottom: 12 }}>Conversaciones Recientes</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['Usuario', 'Inicio', 'Intención', 'Score NLP', 'Estado', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.recentConversations.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state">Sin conversaciones registradas todavía.</div></td></tr>
              )}
              {metrics.recentConversations.map((c, i) => {
                const initials = (c.sessionId || 'U').slice(0, 2).toUpperCase();
                const time = new Date(c.time).toLocaleString('es', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="row-avatar">{initials}</div>
                        <span style={{ color: 'var(--text)' }}>{c.sessionId}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>{time}</td>
                    <td><span className="tag tag-accent">{c.intent || '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-track" style={{ maxWidth: 60, flex: 1 }}>
                          <div className="progress-fill" style={{ '--fill': c.score || 0, background: c.score >= 0.7 ? 'var(--accent)' : 'var(--warning)' }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-sec)' }}>{Math.round((c.score || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${c.resolved ? 'resolved' : 'escalated'}`}>
                        {c.resolved ? 'Chatbot' : 'Humano'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => openDetails(c.sessionId)}>
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                const time = new Date(h.time).toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                return (
                  <React.Fragment key={i}>
                    <div className="chat-msg-row user">
                      <div className="chat-bubble user">{h.message}</div>
                      <div className="chat-time">{time}</div>
                    </div>
                    <div className="chat-msg-row bot">
                      <div className="chat-bubble bot">{h.answer}</div>
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
