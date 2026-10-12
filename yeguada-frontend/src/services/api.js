// services/api.js
// Capa de comunicación con el backend node-nlp + persistencia localStorage

const BASE = '/api';
const LS_CONVERSATIONS = 'yeguada_conversations';
const LS_INTENT_COUNTS = 'yeguada_intent_counts';
const LS_STATS         = 'yeguada_stats';

// ── localStorage helpers ─────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Inicializar stats si es primera vez ──────────────────────────────────────
function initStats() {
  const defaults = { totalChats: 0, resolved: 0, escalated: 0, totalRespMs: 0 };
  return lsGet(LS_STATS, defaults);
}

// ── Registrar una conversación localmente (cuando backend está offline) ──────
export function recordLocalConversation({ sessionId, message, intent, score, resolved, responseTimeMs }) {
  // 1. Conversations list
  const convs = lsGet(LS_CONVERSATIONS, []);
  convs.unshift({ sessionId, time: new Date().toISOString(), message, intent, score, resolved });
  lsSet(LS_CONVERSATIONS, convs.slice(0, 100));

  // 2. Intent counts
  const counts = lsGet(LS_INTENT_COUNTS, {});
  counts[intent || 'unknown'] = (counts[intent || 'unknown'] || 0) + 1;
  lsSet(LS_INTENT_COUNTS, counts);

  // 3. Aggregate stats
  const stats = initStats();
  stats.totalChats++;
  if (resolved) stats.resolved++; else stats.escalated++;
  stats.totalRespMs += (responseTimeMs || 0);
  lsSet(LS_STATS, stats);

  // 4. Notificar al dashboard inmediatamente — sin esperar el poll de 30s
  window.dispatchEvent(new CustomEvent('yeguada:metrics:updated'));
}

// ── API calls ────────────────────────────────────────────────────────────────
export async function sendMessage(message, sessionId = 'admin-preview') {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) throw new Error(`NLP error ${res.status}`);
  const data = await res.json();
  // Registrar en localStorage también cuando backend responde
  recordLocalConversation({ sessionId, message, ...data, responseTimeMs: Date.now() - t0 });
  return data;
}

export async function fetchMetrics() {
  const res = await fetch(`${BASE}/metrics`);
  if (!res.ok) throw new Error(`Metrics error ${res.status}`);
  return res.json();
}

export async function fetchTimeseries() {
  const res = await fetch(`${BASE}/metrics/timeseries`);
  if (!res.ok) throw new Error(`Timeseries error ${res.status}`);
  return res.json();
}

export async function fetchConversationHistory(sessionId) {
  const res = await fetch(`${BASE}/conversations/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`Conversations error ${res.status}`);
  return res.json();
}

// ── Escalamientos a humano ────────────────────────────────────────────────────
export async function fetchEscalations(all = false) {
  const res = await fetch(`${BASE}/escalations${all ? '?all=true' : ''}`);
  if (!res.ok) throw new Error(`Escalations error ${res.status}`);
  return res.json();
}

export async function markEscalationHandled(id) {
  const res = await fetch(`${BASE}/escalations/${id}/handle`, { method: 'PUT' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Escalations error ${res.status}`);
  return data;
}

export async function fetchIntents() {
  const res = await fetch(`${BASE}/intents`);
  if (!res.ok) throw new Error(`Intents error ${res.status}`);
  return res.json();
}

export async function createIntent({ name, answer, examples }) {
  const res = await fetch(`${BASE}/intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, answer, examples }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Intents error ${res.status}`);
  return data;
}

export async function updateIntent(id, { name, answer, examples }) {
  const res = await fetch(`${BASE}/intents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, answer, examples }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Intents error ${res.status}`);
  return data;
}

export async function deleteIntent(id) {
  const res = await fetch(`${BASE}/intents/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Intents error ${res.status}`);
  return data;
}

// ── Base de conocimiento (persistida en el backend) ───────────────────────────
export async function fetchKb() {
  const res = await fetch(`${BASE}/kb`);
  if (!res.ok) throw new Error(`KB error ${res.status}`);
  return res.json();
}

export async function createKbEntry({ intentId, question, answer, tags }) {
  const res = await fetch(`${BASE}/kb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId, question, answer, tags }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `KB error ${res.status}`);
  return data;
}

export async function updateKbEntry(id, { intentId, question, answer, tags }) {
  const res = await fetch(`${BASE}/kb/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId, question, answer, tags }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `KB error ${res.status}`);
  return data;
}

export async function deleteKbEntry(id) {
  const res = await fetch(`${BASE}/kb/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `KB error ${res.status}`);
  return data;
}

export async function resetBackendMetrics() {
  try {
    await fetch(`${BASE}/metrics/reset`, { method: 'DELETE' });
  } catch {} // si el backend está offline no importa, el localStorage ya fue limpiado
}

// ── Configuración (umbral de confianza, persistida en el backend) ────────────
export async function fetchConfig() {
  const res = await fetch(`${BASE}/config`);
  if (!res.ok) throw new Error(`Config error ${res.status}`);
  return res.json();
}

export async function updateConfig({ resolutionThreshold, staffWhatsappNumber }) {
  const res = await fetch(`${BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolutionThreshold, staffWhatsappNumber }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Config error ${res.status}`);
  return data;
}

export async function checkHealth() {
  try { const res = await fetch(`${BASE}/health`); return res.ok; }
  catch { return false; }
}

// ── Control del bot de WhatsApp (whatsapp-web.js) ─────────────────────────────
export async function fetchWhatsappStatus() {
  const res = await fetch(`${BASE}/whatsapp/status`);
  if (!res.ok) throw new Error(`WhatsApp status error ${res.status}`);
  return res.json();
}

export async function connectWhatsapp() {
  const res = await fetch(`${BASE}/whatsapp/connect`, { method: 'POST' });
  if (!res.ok) throw new Error(`WhatsApp connect error ${res.status}`);
  return res.json();
}

export async function disconnectWhatsapp() {
  const res = await fetch(`${BASE}/whatsapp/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error(`WhatsApp disconnect error ${res.status}`);
  return res.json();
}

export async function reconnectWhatsapp() {
  const res = await fetch(`${BASE}/whatsapp/reconnect`, { method: 'POST' });
  if (!res.ok) throw new Error(`WhatsApp reconnect error ${res.status}`);
  return res.json();
}

// ── Métricas locales (cuando backend está offline) ───────────────────────────
export function getLocalMetrics() {
  const stats  = initStats();
  const total  = stats.totalChats || 1;
  return {
    totalChatsToday:    stats.totalChats,
    resolutionRate:     Math.round((stats.resolved / total) * 100),
    escalationRate:     Math.round((stats.escalated / total) * 100),
    avgResponseTimeMs:  Math.round(stats.totalRespMs / total),
    intentCounts:       lsGet(LS_INTENT_COUNTS, {}),
    recentConversations: lsGet(LS_CONVERSATIONS, []),
  };
}

// ── Mock data (primera vez, sin datos locales aún) ────────────────────────────
export const MOCK_METRICS = {
  totalChatsToday: 0,
  resolutionRate: 0,
  escalationRate: 0,
  avgResponseTimeMs: 0,
  intentCounts: {},
  recentConversations: [],
};

