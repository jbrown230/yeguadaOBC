
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Chatbot Backend
// Stack: Express + node-nlp (NaturalLanguageProcessorEs)
// ─────────────────────────────────────────────────────────────
require('./env'); // carga .env antes que cualquier otro módulo
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const {
  trainModel, processMessage,
  createIntentAndRetrain, updateIntentAndRetrain, deleteIntentAndRetrain,
  createKbAndRetrain, updateKbAndRetrain, deleteKbAndRetrain,
} = require('./nlp');
const whatsapp = require('./whatsapp');
const db = require('./db');
const authRoutes = require('./auth/routes');
const authStore = require('./auth/store');
const authCfg = require('./auth/config');
const { seedAdminFromEnv } = require('./auth/seed');
const usersRoutes = require('./auth/users');
const { loadSession, requirePasswordSet, requireRole } = require('./auth/middleware');

const app = express();
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(helmet());
// credentials:true para que el navegador envíe la cookie de sesión; el origen
// debe ser explícito (nunca '*') — ver CORS_ORIGIN en auth/config.js.
app.use(cors({ origin: authCfg.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// ── Autenticación ──
// Públicos: /api/auth/*, /api/health y /api/chat (puede usarlo un widget
// externo; con límite de peticiones). Todo lo demás de /api exige sesión.
app.use(loadSession);
app.use('/api/auth', authRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok', model: 'node-nlp-es', version: '1.0.0' }));
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use('/api', (req, res, next) => (req.path === '/chat' ? next() : requirePasswordSet(req, res, next)));
// Autorización por rol: el operador solo LEE (y puede marcar escalamientos como
// atendidos). Escrituras, WhatsApp (el QR vincula el número) y /users: solo admin.
app.use('/api', (req, res, next) => {
  const operatorWrite = req.method === 'PUT' && /^\/escalations\/\d+\/handle$/.test(req.path);
  const adminOnly = req.path.startsWith('/users') || req.path.startsWith('/whatsapp')
    || (req.method !== 'GET' && !operatorWrite && req.path !== '/chat');
  return adminOnly ? requireRole('admin')(req, res, next) : next();
});
app.use('/api/users', usersRoutes);
if (authCfg.IS_PROD && !require('./mail').isConfigured()) {
  console.warn('⚠️  RESEND_API_KEY no configurada: no se enviarán correos (recuperación de contraseña, invitaciones).');
}
authStore.purgeExpired();
setInterval(authStore.purgeExpired, 60 * 60 * 1000).unref();

// Pagina un array ya cargado en memoria — suficiente para el volumen de
// datos de este proyecto, evita repetir LIMIT/OFFSET en cada query SQL.
function paginate(items, { page, pageSize } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 20);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (p - 1) * size;
  return { items: items.slice(start, start + size), total, page: p, pageSize: size, totalPages };
}

// ── Entrenar y levantar servidor ──
(async () => {
  await seedAdminFromEnv();
  await trainModel();

  // ── ENDPOINTS ──

  // POST /api/chat — Clasificar mensaje y responder
  app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'message requerido' });

    const result = await processMessage(message, sessionId, 'dashboard');
    if (!result.resolved) whatsapp.notifyStaff({ message, channel: 'dashboard', sessionId }).catch(() => {});
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
      pendingEscalations: db.getPendingEscalationsCount(),
    });
  });

  // GET /api/conversations — Historial completo, paginado (?page=&pageSize=)
  app.get('/api/conversations', (req, res) => {
    res.json(paginate(db.listConversations(), req.query));
  });

  // GET /api/conversations/:sessionId — Historial completo de una sesión (sin paginar — es chico)
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
    const intent = await createIntentAndRetrain({ name, answer, examples });
    res.status(201).json(intent);
  });

  // PUT /api/intents/:id — Editar nombre, respuesta y/o frases de ejemplo
  app.put('/api/intents/:id', async (req, res) => {
    const { name, answer, examples } = req.body;
    if (!name || !answer) {
      return res.status(400).json({ error: 'name y answer son requeridos' });
    }
    try {
      const intent = await updateIntentAndRetrain(req.params.id, { name, answer, examples });
      res.json(intent);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // DELETE /api/intents/:id — Eliminar una intención
  app.delete('/api/intents/:id', async (req, res) => {
    try {
      await deleteIntentAndRetrain(req.params.id);
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
    const entry = await createKbAndRetrain({ intentId, question, answer, tags });
    res.status(201).json(entry);
  });

  // PUT /api/kb/:id — Editar entrada
  app.put('/api/kb/:id', async (req, res) => {
    const { question, answer, tags, intentId } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'question y answer son requeridos' });
    }
    try {
      const entry = await updateKbAndRetrain(Number(req.params.id), { intentId, question, answer, tags });
      res.json(entry);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // DELETE /api/kb/:id — Eliminar entrada
  app.delete('/api/kb/:id', async (req, res) => {
    try {
      await deleteKbAndRetrain(Number(req.params.id));
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

  // GET /api/escalations — Pendientes por defecto; ?all=true incluye ya atendidas; paginado (?page=&pageSize=)
  app.get('/api/escalations', (req, res) => {
    const all = db.getEscalations({ includeHandled: req.query.all === 'true' });
    res.json(paginate(all, req.query));
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

  // ── Configuración — persistida en SQLite ──

  // GET /api/config — Configuración actual (umbral de confianza, números de staff)
  app.get('/api/config', (_, res) => {
    res.json({
      resolutionThreshold: db.getResolutionThreshold(),
      staffWhatsappNumbers: db.getStaffWhatsappNumbers(),
    });
  });

  // PUT /api/config — Actualizar configuración (cada campo es opcional/independiente)
  app.put('/api/config', (req, res) => {
    const { resolutionThreshold, staffWhatsappNumbers } = req.body;
    try {
      if (resolutionThreshold !== undefined) db.setResolutionThreshold(resolutionThreshold);
      if (staffWhatsappNumbers !== undefined) db.setStaffWhatsappNumbers(staffWhatsappNumbers);
      res.json({
        resolutionThreshold: db.getResolutionThreshold(),
        staffWhatsappNumbers: db.getStaffWhatsappNumbers(),
      });
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

  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`La Yeguada Chatbot Backend corriendo en http://localhost:${PORT}`);
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
