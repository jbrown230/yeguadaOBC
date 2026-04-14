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
    <div style={{ animation: 'fadeUp 0.3s var(--ease)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Monitoreo de Conversaciones</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Activas Ahora" value="3" sub="2 chatbot · 1 humano" icon="💬" color="teal" />
        <KpiCard label="Completadas Hoy" value={Math.round(totalChatsToday * (resolutionRate / 100))} sub={`${resolutionRate}% tasa de resolución`} icon="✅" color="green" />
        <KpiCard label="En Espera Humano" value={Math.round(totalChatsToday * (escalationRate / 100))} sub={`${escalationRate}% de escalamiento`} icon="👤" color="gold" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Chats por Intención</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={intentData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--stone-mid)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--stone-mid)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid var(--border)' }} />
              <Bar dataKey="total" fill="var(--forest-light)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Métricas de Rendimiento</div>
          {[
            { label: 'Tasa de resolución', value: resolutionRate, color: 'var(--teal-light)', unit: '%' },
            { label: 'Tiempo de respuesta', value: Math.min(avgResponseTimeMs / 50, 100), color: 'var(--gold-light)', unit: `${(avgResponseTimeMs / 1000).toFixed(1)}s` },
            { label: 'Tasa de escalamiento', value: escalationRate, color: 'var(--coral-light)', unit: '%' },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--stone)' }}>{m.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--stone-deep)' }}>{m.unit}</span>
              </div>
              <div style={{ height: 6, background: 'var(--stone-pale)', borderRadius: 3 }}>
                <div style={{ width: `${m.value}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 0.5s var(--ease)' }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '12px', background: 'var(--forest-50)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--forest)', lineHeight: 1.6 }}>
            <strong>💡 Objetivo TFG:</strong> Alcanzar tasa de resolución ≥ 80% comparado con el proceso manual actual.
          </div>
        </div>
      </div>
    </div>
  );
}