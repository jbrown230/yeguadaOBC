// pages/Config.jsx
import React, { useState } from 'react';

const Field = ({ label, value, type = 'text', readOnly = false, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--stone)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
    <input
      type={type}
      defaultValue={value}
      readOnly={readOnly}
      onChange={onChange}
      style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', background: readOnly ? 'var(--stone-pale)' : 'var(--bg)', color: readOnly ? 'var(--stone)' : 'var(--stone-deep)', cursor: readOnly ? 'default' : 'auto' }}
    />
  </div>
);

const Section = ({ title, icon, children }) => (
  <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 14 }}>
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{icon}</span> {title}
    </div>
    {children}
  </div>
);

export default function Config({ backendOnline }) {
  const [threshold, setThreshold] = useState(70);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ animation: 'fadeUp 0.3s var(--ease)', maxWidth: 680 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Configuración del Sistema</h1>

      <Section title="Backend node-nlp" icon="🧠">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--r-sm)', background: backendOnline ? 'var(--teal-pale)' : 'var(--gold-pale)', fontSize: 12, fontWeight: 600, color: backendOnline ? 'var(--teal)' : 'var(--gold)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? 'var(--teal-light)' : 'var(--gold-light)', animation: backendOnline ? 'pulse 2s infinite' : 'none' }} />
          {backendOnline ? 'Backend conectado y respondiendo' : 'Backend offline — Ejecute: npm start en yeguada-backend/'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Host" value="localhost" readOnly />
          <Field label="Puerto" value="3001" readOnly />
          <Field label="Endpoint" value="POST /api/chat" readOnly />
          <Field label="Idioma NLP" value="Español (es)" readOnly />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--stone)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Umbral de confianza (threshold): {threshold}%
          </label>
          <input type="range" min={50} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--forest)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--stone-mid)', marginTop: 3 }}>
            <span>50% (más permisivo)</span>
            <span>95% (más estricto)</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--stone-mid)', marginTop: 6 }}>
            Consultas con score &lt; {threshold}% serán escaladas automáticamente a un operador humano.
          </p>
        </div>
      </Section>

      <Section title="Integración WhatsApp" icon="📱">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Proveedor" value="Twilio / Meta Business API" readOnly />
          <Field label="Número" value="+507 6XXX-XXXX" />
          <Field label="Webhook URL" value="https://tu-servidor.com/webhook/whatsapp" />
          <Field label="API Key" value="••••••••••••••••" type="password" />
        </div>
      </Section>

      <Section title="Escalamiento a Humano" icon="👤">
        {[
          { label: 'Intenciones desconocidas', checked: true },
          { label: 'Score NLP menor al umbral', checked: true },
          { label: 'Palabras clave críticas (urgente, problema, queja)', checked: true },
          { label: 'Más de 3 mensajes sin resolución', checked: false },
        ].map((opt, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked={opt.checked} style={{ accentColor: 'var(--forest)', width: 15, height: 15 }} />
            <span style={{ fontSize: 13, color: 'var(--stone-deep)' }}>{opt.label}</span>
          </label>
        ))}
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button style={{ padding: '9px 20px', background: 'var(--stone-pale)', color: 'var(--stone)', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSave} style={{ padding: '9px 20px', background: saved ? 'var(--teal)' : 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
          {saved ? '✅ Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}