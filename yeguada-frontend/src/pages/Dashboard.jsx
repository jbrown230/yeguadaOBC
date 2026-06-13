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

const STATUS_MAP = {
  true:  { label: 'Resuelto por Chatbot', cls: 'resolved' },
  false: { label: 'Escalado a Humano',    cls: 'escalated' },
};

const PIE_COLORS = ['#3E6B20', '#1D9E75', '#EF9F27', '#888780', '#D85A30', '#3B8BD4'];

const cardStyle = {
  background: 'var(--card)',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: 16,
};

const badgeStyle = (resolved) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 10px',
  borderRadius: 'var(--r-full)',
  background: resolved ? 'var(--teal-pale)' : 'var(--coral-pale)',
  color: resolved ? 'var(--teal)' : 'var(--coral)',
});

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
    <div style={{ animation: 'fadeUp 0.3s var(--ease)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Panel de Control de Rendimiento
      </h1>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total de Chats Hoy" value={metrics.totalChatsToday} sub="↑ 12% vs ayer" color="green" style={{ animationDelay: '0.05s' }} />
        <KpiCard label="Tasa de Resolución" value={`${metrics.resolutionRate}%`} sub="↑ 3% esta semana" color="teal" style={{ animationDelay: '0.1s' }} />
        <KpiCard label="Escalados a Humano" value={`${metrics.escalationRate}%`} sub="↓ 1% vs semana pasada" color="gold" style={{ animationDelay: '0.15s' }} />
        <KpiCard label="Tiempo Prom. Respuesta" value={`${avgSec}s`} sub="node-nlp local" color="stone" style={{ animationDelay: '0.2s' }} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, marginBottom: 16 }}>
        {/* Line Chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Daily Chat Volume (Chatbot vs. Humano)</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['week', 'month'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 'var(--r-full)',
                  border: '0.5px solid var(--border)',
                  cursor: 'pointer',
                  background: range === r ? 'var(--forest-pale)' : 'transparent',
                  color: range === r ? 'var(--forest)' : 'var(--stone)',
                  transition: 'all 0.15s',
                }}>
                  {r === 'week' ? 'Last Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {[{ label: 'Chatbot', color: '#3E6B20' }, { label: 'Humano', color: '#1D9E75' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--stone)' }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--stone-mid)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--stone-mid)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} />
              <Line type="monotone" dataKey="chatbot" stroke="#3E6B20" strokeWidth={2} dot={{ r: 3, fill: '#3E6B20' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="humano" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3, fill: '#1D9E75' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Principales Intenciones</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid var(--border)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversations Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Conversaciones Recientes</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Usuario', 'Inicio', 'Intención', 'Score NLP', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 700, color: 'var(--stone-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.recentConversations.map((c, i) => {
                const initials = (c.sessionId || 'U').slice(0, 2).toUpperCase();
                const time = new Date(c.time).toLocaleString('es', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={i} style={{ borderBottom: '0.5px solid rgba(44,44,42,0.05)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--forest-pale)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                        <span style={{ color: 'var(--stone-deep)' }}>{c.sessionId}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--stone-mid)', whiteSpace: 'nowrap' }}>{time}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--forest-pale)', color: 'var(--forest)', fontWeight: 600 }}>
                        {c.intent || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--stone-pale)', borderRadius: 2, maxWidth: 60 }}>
                          <div style={{ width: `${Math.round((c.score || 0) * 100)}%`, height: '100%', background: c.score >= 0.7 ? 'var(--teal-light)' : 'var(--gold-light)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--stone)' }}>{Math.round((c.score || 0) * 100)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={badgeStyle(c.resolved)}>
                        {c.resolved ? 'Chatbot' : 'Humano'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--forest)', fontWeight: 600, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                        Ver Detalles
                      </button>
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