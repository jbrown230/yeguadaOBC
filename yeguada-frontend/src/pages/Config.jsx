// pages/Config.jsx
import React, { useState } from 'react';

const Field = ({ label, value, type = 'text', readOnly = false, onChange }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    <input
      className="input"
      type={type}
      defaultValue={value}
      readOnly={readOnly}
      onChange={onChange}
    />
  </div>
);

const Section = ({ title, children }) => (
  <div className="panel panel-pad" style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
      {title}
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
    <div className="page-enter" style={{ maxWidth: 700 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <div className="page-sub">Parámetros del backend, umbral de confianza y escalamiento</div>
        </div>
      </div>

      <Section title="Backend node-nlp">
        <div className={`status-badge ${backendOnline ? 'resolved' : 'escalated'}`} style={{ marginBottom: 16, padding: '7px 12px', fontSize: 12 }}>
          <span className={`status-dot ${backendOnline ? 'on' : 'off'}`} />
          {backendOnline ? 'Backend conectado y respondiendo' : 'Backend offline — ejecute: npm start en yeguada-backend/'}
        </div>
        <div className="fields-2">
          <Field label="Host" value="localhost" readOnly />
          <Field label="Puerto" value="3001" readOnly />
          <Field label="Endpoint" value="POST /api/chat" readOnly />
          <Field label="Idioma NLP" value="Español (es)" readOnly />
        </div>

        <div className="field">
          <label className="field-label">
            Umbral de confianza (threshold): <span className="mono">{threshold}%</span>
          </label>
          <input type="range" min={50} max={95} value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-ter)', marginTop: 4 }}>
            <span>50% (más permisivo)</span>
            <span>95% (más estricto)</span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-sec)', marginTop: 8 }}>
            Consultas con score &lt; {threshold}% serán escaladas automáticamente a un operador humano.
          </p>
        </div>
      </Section>

      <Section title="Integración WhatsApp">
        <div className="fields-2">
          <Field label="Proveedor" value="Twilio / Meta Business API" readOnly />
          <Field label="Número" value="+507 6XXX-XXXX" />
          <Field label="Webhook URL" value="https://tu-servidor.com/webhook/whatsapp" />
          <Field label="API Key" value="••••••••••••••••" type="password" />
        </div>
      </Section>

      <Section title="Escalamiento a Humano">
        {[
          { label: 'Intenciones desconocidas', checked: true },
          { label: 'Score NLP menor al umbral', checked: true },
          { label: 'Palabras clave críticas (urgente, problema, queja)', checked: true },
          { label: 'Más de 3 mensajes sin resolución', checked: false },
        ].map((opt, i) => (
          <label key={i} className="checkbox-row">
            <input type="checkbox" defaultChecked={opt.checked} />
            <span>{opt.label}</span>
          </label>
        ))}
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-secondary">Cancelar</button>
        <button onClick={handleSave} className={`btn btn-primary ${saved ? 'is-success' : ''}`}>
          {saved ? 'Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
