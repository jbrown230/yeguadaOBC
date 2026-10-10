// pages/Config.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useWhatsapp } from '../hooks/useWhatsapp';
import { fetchConfig, updateConfig } from '../services/api';

const WA_LABELS = {
  disconnected: 'Desconectado',
  initializing: 'Iniciando…',
  qr: 'Esperando escaneo de QR',
  authenticated: 'Autenticado, conectando…',
  connected: 'Conectado',
  disconnecting: 'Desconectando…',
};
const WA_PENDING = ['initializing', 'qr', 'authenticated', 'disconnecting'];

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
  const [savedThreshold, setSavedThreshold] = useState(70);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const wa = useWhatsapp();

  const loadConfig = useCallback(async () => {
    try {
      const { resolutionThreshold } = await fetchConfig();
      const pct = Math.round(resolutionThreshold * 100);
      setThreshold(pct);
      setSavedThreshold(pct);
      setError(null);
    } catch {
      // backend offline al cargar — se queda con el valor por defecto
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateConfig({ resolutionThreshold: threshold / 100 });
      setSavedThreshold(threshold);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setThreshold(savedThreshold);
    setError(null);
  }

  const waStatus = wa.status.status;
  const waConnected = waStatus === 'connected';
  const waLabel = backendOnline
    ? (wa.unavailable ? 'No se pudo consultar el estado del bot' : (WA_LABELS[waStatus] || waStatus))
    : 'Backend offline — no se puede controlar el bot';

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
        <div className={`status-badge ${waConnected ? 'resolved' : 'escalated'}`} style={{ marginBottom: 16, padding: '7px 12px', fontSize: 12 }}>
          <span className={`status-dot ${waConnected ? 'on' : 'off'}`} />
          {waLabel}
        </div>

        <div className="fields-2">
          <Field label="Proveedor" value="whatsapp-web.js (no oficial)" readOnly />
          <Field label="Método de conexión" value="Código QR — Dispositivos vinculados" readOnly />
          <Field label="Sesión" value="Guardada en yeguada-backend/.wwebjs_auth/" readOnly />
          <Field label="Número vinculado" value={wa.status.info?.number ? `+${wa.status.info.number}` : '—'} readOnly />
        </div>

        {waStatus === 'qr' && wa.status.qr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '10px 0 18px' }}>
            <img
              src={wa.status.qr}
              alt="Código QR para vincular WhatsApp"
              style={{ width: 200, height: 200, borderRadius: 8, border: '1px solid var(--border-strong)' }}
            />
            <p style={{ fontSize: 11.5, color: 'var(--text-sec)', textAlign: 'center', maxWidth: 340 }}>
              Escanéalo desde WhatsApp → Configuración → Dispositivos vinculados → Vincular un dispositivo.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {waStatus === 'disconnected' && (
            <button className="btn btn-primary" onClick={wa.connect} disabled={wa.busy || !backendOnline}>
              Conectar
            </button>
          )}
          {waConnected && (
            <button className="btn btn-secondary" onClick={wa.reconnect} disabled={wa.busy || !backendOnline}>
              Reconectar
            </button>
          )}
          {(waConnected || WA_PENDING.includes(waStatus)) && (
            <button className="btn btn-danger-ghost" onClick={wa.disconnect} disabled={wa.busy || !backendOnline}>
              Desconectar
            </button>
          )}
        </div>

        <p style={{ fontSize: 11.5, color: 'var(--text-sec)', marginTop: 12 }}>
          No requiere cuenta de Meta Business ni webhook — vincula un número real de WhatsApp directamente desde este panel.
          "Desconectar" desvincula el dispositivo (pedirá un nuevo QR la próxima vez); "Reconectar" solo reinicia el bot reutilizando la sesión actual.
        </p>
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

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'right', marginBottom: 10 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-secondary" onClick={handleCancel} disabled={saving || threshold === savedThreshold}>Cancelar</button>
        <button onClick={handleSave} className={`btn btn-primary ${saved ? 'is-success' : ''}`} disabled={saving || threshold === savedThreshold}>
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
