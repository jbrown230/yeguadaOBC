
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Motor NLP compartido
// Usado por server.js (dashboard) y whatsapp.js (bot WhatsApp)
// Las intenciones y sus frases de entrenamiento viven en db.js
// (SQLite) — se cargan aquí cada vez que se entrena el modelo.
// ─────────────────────────────────────────────────────────────
const { NlpManager } = require('node-nlp');
const { StemmerEs, StopwordsEs, TokenizerEs } = require('@nlpjs/lang-es');
const db = require('./db');

// Reasignado por completo en cada trainModel() — nunca se muta en caliente.
let manager = new NlpManager({ languages: ['es'], forceNER: true });

const ESCALATION_MESSAGE = '🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX.';

// ── Respuestas puntuales de la Base de Conocimiento ──
// Una vez que el clasificador principal ya resolvió la intención (sin tocar
// ese modelo), buscamos entre las entradas de KB ligadas a esa intención
// la más parecida al mensaje del usuario (stems en español + sin stopwords,
// reutilizando el mismo motor que ya trae node-nlp). Si hay una suficientemente
// cercana, usamos su respuesta puntual; si no, se usa la respuesta genérica
// de la intención (comportamiento anterior).
const stemmerContainer = { get: () => undefined, register: () => {} };
const stemmer = new StemmerEs(stemmerContainer);
stemmer.tokenizer = new TokenizerEs(stemmerContainer);
stemmer.stopwords = new StopwordsEs(stemmerContainer);
const KB_MATCH_THRESHOLD = 0.4;

function stemSet(text) {
  return new Set(stemmer.tokenizeAndStem(text, false));
}

function wordOverlap(a, b) {
  const setA = stemSet(a);
  const setB = stemSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / new Set([...setA, ...setB]).size;
}

// Entre las entradas de KB de `intentId`, la más parecida a `message` (si
// supera el umbral). Devuelve su respuesta puntual o null.
function findKbAnswer(intentId, message) {
  let best = null;
  for (const entry of db.getKbEntriesByIntent(intentId)) {
    const score = wordOverlap(message, entry.question);
    if (score >= KB_MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { answer: entry.answer, score };
    }
  }
  return best;
}

// Reconstruye el manager desde cero con las intenciones actuales de la BD
// y lo entrena. Se llama al arrancar el servidor y después de cualquier
// cambio en intenciones o en la Base de Conocimiento (crear/editar/eliminar)
// desde el dashboard.
async function trainModel() {
  console.log('Entrenando modelo NLP...');
  const fresh = new NlpManager({ languages: ['es'], forceNER: true });

  const intents = db.listIntents();
  for (const intent of intents) {
    for (const phrase of intent.examples) {
      fresh.addDocument('es', phrase, intent.id);
    }
    fresh.addAnswer('es', intent.id, intent.answer);
  }

  // Las entradas de la Base de Conocimiento con una intención asociada también
  // entrenan al modelo — su "pregunta" se suma como frase de ejemplo de esa
  // intención (la respuesta que usa el bot sigue siendo la de la intención,
  // no la de la entrada, para mantener una sola respuesta predecible por intención).
  let kbCount = 0;
  for (const entry of db.listKb()) {
    if (!entry.intent_id) continue;
    fresh.addDocument('es', entry.question, entry.intent_id);
    kbCount++;
  }

  await fresh.train();
  fresh.save();
  manager = fresh;
  console.log(`Modelo entrenado y guardado (${intents.length} intenciones, ${kbCount} preguntas de la Base de Conocimiento).\n`);
}

// Procesa un mensaje, actualiza métricas y devuelve la respuesta.
// `channel` identifica el origen ('dashboard', 'whatsapp', etc.) para trazabilidad.
async function processMessage(message, sessionId, channel = 'dashboard') {
  const start = Date.now();
  const response = await manager.process('es', message);
  const elapsed = Date.now() - start;
  // node-nlp devuelve intent 'None' con score 1 (no un score bajo en la intención
  // más cercana) cuando ninguna intención entrenada supera su umbral interno.
  // Sin este chequeo, 'None' se contaba como resuelto pero sin `answer` real.
  // 'fuera.de.alcance' es una intención entrenada a propósito (quejas, pagos,
  // clima, robos, señal/wifi, artesanías) para que el bot la reconozca con
  // confianza y escale, en vez de adivinar una intención real por solapamiento
  // de vocabulario. Su id lo generó slugify() a partir del nombre en db.js.
  const resolved = response.intent !== 'None' && response.intent !== 'fuera.de.alcance'
    && response.score >= db.getResolutionThreshold();

  let answer = resolved ? response.answer : ESCALATION_MESSAGE;
  if (resolved) {
    const kbMatch = findKbAnswer(response.intent, message);
    if (kbMatch) answer = kbMatch.answer;
  }

  db.recordConversation({
    sessionId,
    channel,
    message,
    intent: response.intent,
    score: response.score,
    resolved,
    answer,
    responseTimeMs: elapsed,
  });

  return {
    intent: response.intent,
    score: response.score,
    answer,
    resolved,
    escalated: !resolved,
    responseTimeMs: elapsed,
  };
}

module.exports = {
  trainModel,
  processMessage,
};
