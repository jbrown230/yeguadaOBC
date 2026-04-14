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

export async function fetchIntents() {
  const res = await fetch(`${BASE}/intents`);
  if (!res.ok) throw new Error(`Intents error ${res.status}`);
  return res.json();
}

export async function resetBackendMetrics() {
  try {
    await fetch(`${BASE}/metrics/reset`, { method: 'DELETE' });
  } catch {} // si el backend está offline no importa, el localStorage ya fue limpiado
}

export async function checkHealth() {
  try { const res = await fetch(`${BASE}/health`); return res.ok; }
  catch { return false; }
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

export const MOCK_INTENTS = [
  { id: 'booking.tour',        name: 'Reserva de Tours',         examples: ['quiero reservar un tour', 'cómo reservo', 'apartar un cupo'] },
  { id: 'pricing.info',        name: 'Precios y Tarifas',        examples: ['cuánto cuesta', 'cuál es la tarifa', 'precio grupal'] },
  { id: 'guide.availability',  name: 'Disponibilidad de Guía',   examples: ['hay guías disponibles', 'necesito un guía'] },
  { id: 'general.info',        name: 'Información General',      examples: ['qué actividades hay', 'cuéntame sobre la yeguada'] },
  { id: 'location.directions', name: 'Cómo Llegar',              examples: ['cómo llego', 'dónde queda', 'ruta desde panamá'] },
  { id: 'camping.info',        name: 'Camping',                  examples: ['puedo acampar', 'área de carpas', 'pasar la noche'] },
  { id: 'waterfall.info',      name: 'Cascadas',                 examples: ['cascadas celestes', 'la silampa', 'tour cascadas'] },
  { id: 'hours.info',          name: 'Horarios',                 examples: ['a qué hora abren', 'cuál es el horario'] },
];

export const KB_ENTRIES = [
  { id: 1, intent: 'booking.tour', question: '¿Cómo puedo reservar un tour en La Yeguada?', answer: 'Para reservar un tour, contáctenos por WhatsApp al +507 6XXX-XXXX. Reserve con al menos 48h de anticipación.', tags: ['tours', 'reserva', 'WhatsApp'] },
  { id: 2, intent: 'pricing.info', question: '¿Cuáles son los precios de los tours?', answer: 'Senderismo básico: $25/persona. Cascadas: $35/persona. Tour completo + almuerzo: $45/persona. Grupos 8+: 15% descuento.', tags: ['precios', 'tours'] },
  { id: 3, intent: 'location.directions', question: '¿Cómo llego a la Reserva Forestal La Yeguada?', answer: 'Desde Ciudad de Panamá: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas). Se recomienda 4x4.', tags: ['cómo llegar', 'ubicación'] },
  { id: 4, intent: 'general.info', question: '¿Qué actividades ofrece Ecoturismo La Yeguada OBC?', answer: 'Senderismo, Cascadas Celestes, kayak en la Laguna volcánica, agroturismo, avistamiento de aves (200+ sp.), camping y talleres culturales.', tags: ['actividades', 'tours'] },
  { id: 5, intent: 'camping.info', question: '¿Se puede acampar en La Yeguada?', answer: 'Sí. Zona natural a orillas de la Laguna y Estación ANAM con baños/duchas. Capacidad limitada — reserve con anticipación.', tags: ['camping', 'noche'] },
  { id: 6, intent: 'waterfall.info', question: '¿Cómo visito las Cascadas Celestes?', answer: 'Sendero ~45 min, incluida en tour $35. La Cascada La Silampa requiere ~1h45 con guía.', tags: ['cascadas', 'senderismo'] },
];