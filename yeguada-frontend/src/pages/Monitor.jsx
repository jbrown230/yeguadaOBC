// pages/Monitor.jsx
import React from 'react';
import KpiCard from '../components/Kpicard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Monitor(props) {
  const metrics = props?.metrics ?? {};

  const intentCounts = metrics?.intentCounts ?? {};
  const totalChatsToday = metrics?.totalChatsToday ?? 0;
  const resolutionRate = metrics?.resolutionRate ?? 0;
  const escalationRate = metrics?.escalationRate ?? 0;
  const avgResponseTimeMs = metrics?.avgResponseTimeMs ?? 0;

  const intentData = Object.entries(intentCounts).map(([k, v]) => ({
    name: k.split('.')[0],
    total: v,
  }));

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Monitoreo de Conversaciones</h1>
          <div className="page-sub">Estado en vivo de la actividad del chatbot</div>
        </div>
      </div>

      <div className="stat-strip">
        <KpiCard label="Activas Ahora" value="3" sub="2 chatbot · 1 humano" />
        <KpiCard label="Completadas Hoy" value={Math.round(totalChatsToday * (resolutionRate / 100))} sub={`${resolutionRate}% tasa de resolución`} />
        <KpiCard label="En Espera Humano" value={Math.round(totalChatsToday * (escalationRate / 100))} sub={`${escalationRate}% de escalamiento`} />
      </div>

      <div className="monitor-charts">
        <div className="panel panel-pad">
          <div className="panel-title" style={{ marginBottom: 12 }}>Chats por Intención</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={intentData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: 'var(--text-ter)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11.5, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--font-sans)' }} />
              <Bar dataKey="total" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel panel-pad">
          <div className="panel-title" style={{ marginBottom: 14 }}>Métricas de Rendimiento</div>
          {[
            { label: 'Tasa de resolución', value: resolutionRate, color: 'var(--accent)', unit: `${resolutionRate}%` },
            { label: 'Tiempo de respuesta', value: Math.min(avgResponseTimeMs / 50, 100), color: 'var(--warning)', unit: `${(avgResponseTimeMs / 1000).toFixed(1)}s` },
            { label: 'Tasa de escalamiento', value: escalationRate, color: 'var(--danger)', unit: `${escalationRate}%` },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{m.label}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.unit}</span>
              </div>
              <div className="progress-track" style={{ height: 6 }}>
                <div className="progress-fill" style={{ '--fill': m.value / 100, background: m.color }} />
              </div>
            </div>
          ))}

          <div className="callout" style={{ marginTop: 16 }}>
            <strong>Objetivo TFG:</strong> Alcanzar tasa de resolución ≥ 80% comparado con el proceso manual actual.
          </div>
        </div>
      </div>
    </div>
  );
}
