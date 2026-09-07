// pages/Dashboard.jsx
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import KpiCard from '../components/Kpicard';

const WEEK_DATA = [
  { day: 'Lun', chatbot: 85, humano: 20 },
  { day: 'Mar', chatbot: 92, humano: 18 },
  { day: 'Mié', chatbot: 78, humano: 25 },
  { day: 'Jue', chatbot: 110, humano: 28 },
  { day: 'Vie', chatbot: 120, humano: 22 },
  { day: 'Sáb', chatbot: 95, humano: 30 },
  { day: 'Dom', chatbot: 60, humano: 15 },
];

const MONTH_DATA = [
  { day: 'Sem 1', chatbot: 520, humano: 110 },
  { day: 'Sem 2', chatbot: 610, humano: 140 },
  { day: 'Sem 3', chatbot: 580, humano: 130 },
  { day: 'Sem 4', chatbot: 640, humano: 150 },
];

const PIE_COLORS = ['#396B2C', '#FFA700', '#8A5A12', '#7B8190', '#A3312A', '#454A54'];

export default function Dashboard({ metrics }) {
  const [range, setRange] = useState('week');
  const chartData = range === 'week' ? WEEK_DATA : MONTH_DATA;

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
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Ver detalles</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
