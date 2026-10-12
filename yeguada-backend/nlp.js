
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Motor NLP compartido
// Usado por server.js (dashboard) y whatsapp.js (bot WhatsApp)
// Las intenciones y sus frases de entrenamiento viven en db.js
// (SQLite) — se cargan aquí cada vez que se entrena el modelo.
// ─────────────────────────────────────────────────────────────
const { NlpManager } = require('node-nlp');
const db = require('./db');

// Reasignado por completo en cada trainModel() — nunca se muta en caliente.
let manager = new NlpManager({ languages: ['es'], forceNER: true });

const ESCALATION_MESSAGE = '🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX.';

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

  db.recordConversation({
    sessionId,
    channel,
    message,
    intent: response.intent,
    score: response.score,
    resolved,
    answer: response.answer,
    responseTimeMs: elapsed,
  });

  return {
    intent: response.intent,
    score: response.score,
    answer: resolved ? response.answer : ESCALATION_MESSAGE,
    resolved,
    escalated: !resolved,
    responseTimeMs: elapsed,
  };
}

module.exports = {
  trainModel,
  processMessage,
};
