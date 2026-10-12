
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Chatbot Backend
// Stack: Express + node-nlp (NaturalLanguageProcessorEs)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const { trainModel, processMessage } = require('./nlp');
const whatsapp = require('./whatsapp');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── Entrenar y levantar servidor ──
(async () => {
  await trainModel();

  // ── ENDPOINTS ──

  // POST /api/chat — Clasificar mensaje y responder
  app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'message requerido' });

    const result = await processMessage(message, sessionId, 'dashboard');
    res.json(result);
  });

  // GET /api/metrics — Dashboard de métricas (persistidas, sobreviven reinicios)
  app.get('/api/metrics', (_, res) => {
    const metrics = db.getMetrics();
    const total = metrics.totalChats || 1;
    res.json({
      totalChatsToday: metrics.totalChats,
      resolutionRate: Math.round((metrics.resolvedByBot / total) * 100),
      escalationRate: Math.round((metrics.escalatedToHuman / total) * 100),
      avgResponseTimeMs: Math.round(metrics.totalResponseTimeMs / total),
      intentCounts: metrics.intentCounts,
      recentConversations: metrics.recentConversations,
      activeNow: db.getActiveSessions(),
    });
  });

  // GET /api/conversations/:sessionId — Historial completo de una sesión
  app.get('/api/conversations/:sessionId', (req, res) => {
    res.json(db.getConversationsBySession(req.params.sessionId));
  });

  // ── Intenciones NLP — CRUD persistido en SQLite (ver db.js) ──
  // Cualquier cambio reentrena el modelo para que surta efecto de inmediato.

  // GET /api/intents — Lista de intenciones configuradas (con sus frases de ejemplo)
  app.get('/api/intents', (_, res) => {
    res.json(db.listIntents());
  });

  // POST /api/intents — Crear una nueva intención
  app.post('/api/intents', async (req, res) => {
    const { name, answer, examples } = req.body;
    if (!name || !answer || !Array.isArray(examples) || examples.length === 0) {
      return res.status(400).json({ error: 'name, answer y examples (array no vacío) son requeridos' });
    }
    const intent = db.createIntent({ name, answer, examples });
    await trainModel();
    res.status(201).json(intent);
  });

  // PUT /api/intents/:id — Editar nombre, respuesta y/o frases de ejemplo
  app.put('/api/intents/:id', async (req, res) => {
    const { name, answer, examples } = req.body;
    if (!name || !answer) {
      return res.status(400).json({ error: 'name y answer son requeridos' });
    }
    try {
      const intent = db.updateIntent(req.params.id, { name, answer, examples });
      await trainModel();
      res.json(intent);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // DELETE /api/intents/:id — Eliminar una intención
  app.delete('/api/intents/:id', async (req, res) => {
    try {
      db.deleteIntent(req.params.id);
      await trainModel();
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // ── Base de Conocimiento — CRUD persistido en SQLite ──
  // Las entradas con una intención asociada también entrenan al modelo
  // (su "pregunta" se suma como frase de ejemplo de esa intención), así
  // que cualquier cambio reentrena igual que con las intenciones.

  // GET /api/kb — Listar entradas
  app.get('/api/kb', (_, res) => {
    res.json(db.listKb());
  });

  // POST /api/kb — Crear entrada
  app.post('/api/kb', async (req, res) => {
    const { question, answer, tags, intentId } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'question y answer son requeridos' });
    }
    const entry = db.createKb({ intentId, question, answer, tags });
    if (intentId) await trainModel();
    res.status(201).json(entry);
  });

  // PUT /api/kb/:id — Editar entrada
  app.put('/api/kb/:id', async (req, res) => {
    const { question, answer, tags, intentId } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'question y answer son requeridos' });
    }
    try {
      const entry = db.updateKb(Number(req.params.id), { intentId, question, answer, tags });
      await trainModel();
      res.json(entry);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // DELETE /api/kb/:id — Eliminar entrada
  app.delete('/api/kb/:id', async (req, res) => {
    try {
      db.deleteKb(Number(req.params.id));
      await trainModel();
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // GET /api/metrics/timeseries — Volumen real de chats (chatbot vs. humano) por día/semana
  app.get('/api/metrics/timeseries', (_, res) => {
    res.json(db.getTimeseries());
  });

  // ── Escalamientos a humano — cola de conversaciones que el bot no resolvió ──

  // GET /api/escalations — Pendientes por defecto; ?all=true incluye ya atendidas
  app.get('/api/escalations', (req, res) => {
    res.json(db.getEscalations({ includeHandled: req.query.all === 'true' }));
  });

  // PUT /api/escalations/:id/handle — Marcar como atendida
  app.put('/api/escalations/:id/handle', (req, res) => {
    try {
      db.markEscalationHandled(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // DELETE /api/metrics/reset — Borrar historial de conversaciones (llamado desde el botón Limpiar del frontend)
  app.delete('/api/metrics/reset', (_, res) => {
    db.resetMetrics();
    console.log('🧹 Métricas reseteadas');
    res.json({ ok: true });
  });

  // GET /api/health
  app.get('/api/health', (_, res) => res.json({ status: 'ok', model: 'node-nlp-es', version: '1.0.0' }));

  // ── Configuración — persistida en SQLite ──

  // GET /api/config — Configuración actual (ej. umbral de confianza)
  app.get('/api/config', (_, res) => {
    res.json({ resolutionThreshold: db.getResolutionThreshold() });
  });

  // PUT /api/config — Actualizar configuración
  app.put('/api/config', (req, res) => {
    const { resolutionThreshold } = req.body;
    try {
      const value = db.setResolutionThreshold(resolutionThreshold);
      res.json({ resolutionThreshold: value });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // ── Bot de WhatsApp — control dinámico desde el dashboard ──

  // GET /api/whatsapp/status — Estado actual (disconnected/initializing/qr/authenticated/connected)
  app.get('/api/whatsapp/status', (_, res) => {
    res.json(whatsapp.getStatus());
  });

  // POST /api/whatsapp/connect — Inicia el cliente (pide QR si no hay sesión guardada)
  app.post('/api/whatsapp/connect', (_, res) => {
    res.json(whatsapp.connect());
  });

  // POST /api/whatsapp/disconnect — Cierra sesión y desvincula el dispositivo
  app.post('/api/whatsapp/disconnect', async (_, res) => {
    res.json(await whatsapp.disconnect());
  });

  // POST /api/whatsapp/reconnect — Reinicia el cliente reutilizando la sesión guardada
  app.post('/api/whatsapp/reconnect', async (_, res) => {
    res.json(await whatsapp.reconnect());
  });

  app.listen(3001, () => {
    console.log('La Yeguada Chatbot Backend corriendo en http://localhost:3001');
    console.log('   POST /api/chat              — Clasificar mensaje');
    console.log('   GET  /api/metrics           — Métricas del dashboard');
    console.log('   GET  /api/intents           — Listar intenciones (CRUD completo)');
    console.log('   GET  /api/kb                — Base de conocimiento (CRUD completo)');
    console.log('   GET  /api/whatsapp/status    — Estado del bot de WhatsApp');
    console.log('   POST /api/whatsapp/connect   — Conectar (código QR)');
    console.log('   POST /api/whatsapp/disconnect — Desconectar\n');
  });

  // Auto-conectar al arrancar si se define la variable de entorno (opcional,
  // pensado para despliegues sin acceso al dashboard). El flujo recomendado
  // es conectar/desconectar/reconectar desde Configuración en el dashboard.
  if (process.env.ENABLE_WHATSAPP === 'true') {
    whatsapp.connect();
  }
})();
