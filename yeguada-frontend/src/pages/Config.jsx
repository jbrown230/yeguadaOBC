// pages/Config.jsx — configuración del sistema (solo admin). Tres secciones, lista agrupada.
import React, { useState, useEffect, useCallback } from 'react';
import { useWhatsapp } from '../hooks/useWhatsapp';
import { fetchConfig, updateConfig } from '../services/api';
import { SettingsLayout, Group, Row, Status } from '../components/Settings';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const WA_LABELS = {
  disconnected: 'Desconectado',
  initializing: 'Iniciando…',
  qr: 'Esperando escaneo de QR',
  authenticated: 'Autenticado, conectando…',
  connected: 'Conectado',
  disconnecting: 'Desconectando…',
};
const WA_PENDING = ['initializing', 'qr', 'authenticated', 'disconnecting'];
const TABS = [
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'system', label: 'Sistema' },
];

export default function Config({ backendOnline }) {
  const [tab, setTab] = useState('chatbot');
  const [threshold, setThreshold] = useState(70);
  const [savedThreshold, setSavedThreshold] = useState(70);
  const [staffNumbersText, setStaffNumbersText] = useState('');
  const [savedStaffNumbersText, setSavedStaffNumbersText] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const wa = useWhatsapp();
  const toast = useToast();
  const confirm = useConfirm();

  async function confirmDisconnect() {
    const ok = await confirm({
      title: '¿Desconectar WhatsApp?',
      message: 'Se desvincula el dispositivo: el bot dejará de responder por WhatsApp y la próxima vez pedirá escanear un nuevo código QR.',
      confirmLabel: 'Desconectar', tone: 'danger',
    });
    if (ok) { await wa.disconnect(); toast.info('WhatsApp desconectado'); }
  }

  const loadConfig = useCallback(async () => {
    try {
      const { resolutionThreshold, staffWhatsappNumbers } = await fetchConfig();
      const pct = Math.round(resolutionThreshold * 100);
      const numbersText = (staffWhatsappNumbers || []).join(', ');
      setThreshold(pct);
      setSavedThreshold(pct);
      setStaffNumbersText(numbersText);
      setSavedStaffNumbersText(numbersText);
      setError(null);
    } catch {
      // backend offline al cargar — se queda con el valor por defecto
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const dirty = threshold !== savedThreshold || staffNumbersText !== savedStaffNumbersText;

  async function handleSave() {
    setSaving(true);
    try {
      const staffWhatsappNumbers = staffNumbersText.split(',').map((n) => n.trim()).filter(Boolean);
      await updateConfig({ resolutionThreshold: threshold / 100, staffWhatsappNumbers });
      setSavedThreshold(threshold);
      setSavedStaffNumbersText(staffNumbersText);
      setError(null);
      setSaved(true);
      toast.success('Configuración guardada');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setThreshold(savedThreshold);
    setStaffNumbersText(savedStaffNumbersText);
    setError(null);
  }

  const waStatus = wa.status.status;
  const waConnected = waStatus === 'connected';
  const waLabel = backendOnline
    ? (wa.unavailable ? 'No se pudo consultar' : (WA_LABELS[waStatus] || waStatus))
    : 'Backend offline';

  return (
    <>
      <SettingsLayout
        title="Configuración"
        subtitle="Ajustes del chatbot, WhatsApp y el sistema"
        tabs={TABS} active={tab} onChange={setTab}
      >
        {tab === 'chatbot' && (
          <>
            <Group
              title="Confianza"
              note={`Las consultas con puntaje menor a ${threshold}% se escalan automáticamente a una persona.`}
            >
              <Row label="Umbral de confianza" desc="Qué tan seguro debe estar el bot para responder solo." stack>
                <div className="slider-row">
                  <span className="slider-end">Permisivo</span>
                  <input type="range" min={50} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label="Umbral de confianza" />
                  <span className="slider-end">Estricto</span>
                  <span className="value-pill">{threshold}%</span>
                </div>
              </Row>
            </Group>

            <Group
              title="Escalamiento"
              note="Cuando el bot escale una conversación, se avisa por WhatsApp a estos números. Déjalo vacío para desactivar el aviso. Requiere el bot conectado."
            >
              <Row label="Números del equipo" desc="Con código de país, separados por coma." stack>
                <input
                  className="input" type="text" value={staffNumbersText}
                  onChange={(e) => setStaffNumbersText(e.target.value)}
                  placeholder="50761234567, 50798765432"
                />
              </Row>
            </Group>
          </>
        )}

        {tab === 'whatsapp' && (
          <>
            <Group title="Conexión">
              <Row label="Estado"><Status ok={waConnected}>{waLabel}</Status></Row>
              <Row label="Número vinculado">
                <span className="settings-value">{wa.status.info?.number ? `+${wa.status.info.number}` : '—'}</span>
              </Row>
              <Row label="Acciones">
                <div className="row-actions">
                  {waStatus === 'disconnected' && (
                    <button className="btn btn-primary btn-sm" onClick={wa.connect} disabled={wa.busy || !backendOnline}>Conectar</button>
                  )}
                  {waConnected && (
                    <button className="btn btn-secondary btn-sm" onClick={wa.reconnect} disabled={wa.busy || !backendOnline}>Reconectar</button>
                  )}
                  {(waConnected || WA_PENDING.includes(waStatus)) && (
                    <button className="btn btn-danger-ghost btn-sm" onClick={confirmDisconnect} disabled={wa.busy || !backendOnline}>Desconectar</button>
                  )}
                </div>
              </Row>
            </Group>

            {waStatus === 'qr' && wa.status.qr && (
              <Group title="Vincular dispositivo" note="Escanéalo desde WhatsApp → Configuración → Dispositivos vinculados → Vincular un dispositivo.">
                <div className="qr-box">
                  <img src={wa.status.qr} alt="Código QR para vincular WhatsApp" />
                </div>
              </Group>
            )}

            <p className="settings-note" style={{ marginTop: 4 }}>
              No requiere cuenta de Meta Business ni webhook: vincula un número real directamente desde aquí.
              “Desconectar” desvincula el dispositivo (pedirá un nuevo QR); “Reconectar” solo reinicia el bot con la sesión actual.
            </p>
          </>
        )}

        {tab === 'system' && (
          <Group title="Servidor" note="Información de solo lectura.">
            <Row label="Backend"><Status ok={backendOnline}>{backendOnline ? 'Conectado' : 'Sin conexión'}</Status></Row>
            <Row label="Dirección"><span className="settings-value">localhost:3001</span></Row>
            <Row label="Endpoint de chat"><span className="settings-value">POST /api/chat</span></Row>
            <Row label="Idioma del NLP"><span className="settings-value">Español</span></Row>
            <Row label="Proveedor de WhatsApp"><span className="settings-value">whatsapp-web.js</span></Row>
            <Row label="Sesión de WhatsApp"><span className="settings-value mono-ish">yeguada-backend/.wwebjs_auth/</span></Row>
          </Group>
        )}
      </SettingsLayout>

      <div className={`save-bar${dirty ? ' visible' : ''}`} aria-hidden={!dirty}>
        <span className="save-bar-msg">{error ? <span style={{ color: 'var(--danger)' }}>{error}</span> : 'Tienes cambios sin guardar'}</span>
        <button className="btn btn-ghost" onClick={handleCancel} disabled={saving || !dirty} tabIndex={dirty ? 0 : -1}>Cancelar</button>
        <button onClick={handleSave} className={`btn btn-primary ${saved ? 'is-success' : ''}`} disabled={saving || !dirty} tabIndex={dirty ? 0 : -1}>
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </>
  );
}
