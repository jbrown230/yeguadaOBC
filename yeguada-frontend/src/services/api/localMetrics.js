// services/api/localMetrics.js
// Persistencia local (localStorage) para cuando el backend está offline.

const LS_CONVERSATIONS = 'yeguada_conversations';
const LS_INTENT_COUNTS = 'yeguada_intent_counts';
const LS_STATS         = 'yeguada_stats';

function lsGet(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function initStats() {
  const defaults = { totalChats: 0, resolved: 0, escalated: 0, totalRespMs: 0 };
  return lsGet(LS_STATS, defaults);
}

// Registra una conversación localmente (cuando backend está offline, o
// siempre como respaldo adicional cuando responde).
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

// Mock data (primera vez, sin datos locales aún).
export const MOCK_METRICS = {
  totalChatsToday: 0,
  resolutionRate: 0,
  escalationRate: 0,
  avgResponseTimeMs: 0,
  intentCounts: {},
  recentConversations: [],
};
