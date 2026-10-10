
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Chatbot Backend
// Stack: Express + node-nlp (NaturalLanguageProcessorEs)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const { metrics, trainModel, processMessage, resetMetrics } = require('./nlp');
const whatsapp = require('./whatsapp');

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

  // GET /api/metrics — Dashboard de métricas
  app.get('/api/metrics', (req, res) => {
    const total = metrics.totalChats || 1;
    res.json({
      totalChatsToday: metrics.totalChats,
      resolutionRate: Math.round((metrics.resolvedByBot / total) * 100),
      escalationRate: Math.round((metrics.escalatedToHuman / total) * 100),
      avgResponseTimeMs: Math.round(metrics.totalResponseTimeMs / total),
      intentCounts: metrics.intentCounts,
      recentConversations: metrics.recentConversations.slice(0, 20),
    });
  });

  // GET /api/intents — Lista de intenciones configuradas
  app.get('/api/intents', (req, res) => {
    const intentList = [
      { id: 'booking.tour', name: 'Reserva de Tours', examples: ['quiero reservar un tour', 'cómo hago una reserva', 'quiero ir a la yeguada'] },
      { id: 'pricing.info', name: 'Precios y Tarifas', examples: ['cuánto cuesta', 'cuál es el precio', 'tarifa grupal'] },
      { id: 'guide.availability', name: 'Disponibilidad de Guía', examples: ['hay guías disponibles', 'necesito un guía'] },
      { id: 'general.info', name: 'Información General', examples: ['qué actividades ofrecen', 'qué hay para hacer'] },
      { id: 'location.directions', name: 'Cómo Llegar', examples: ['cómo llego', 'dónde queda', 'dirección'] },
      { id: 'camping.info', name: 'Camping', examples: ['puedo acampar', 'área de camping', 'pasar la noche'] },
      { id: 'waterfall.info', name: 'Cascadas', examples: ['cascadas celestes', 'la silampa', 'tour a cascadas'] },
      { id: 'hours.info', name: 'Horarios', examples: ['cuál es el horario', 'a qué hora abren'] },
    ];
    res.json(intentList);
  });

  // DELETE /api/metrics/reset — Limpiar métricas en memoria (llamado desde el botón Limpiar del frontend)
  app.delete('/api/metrics/reset', (_, res) => {
    resetMetrics();
    console.log('🧹 Métricas reseteadas');
    res.json({ ok: true });
  });

  // GET /api/health
  app.get('/api/health', (_, res) => res.json({ status: 'ok', model: 'node-nlp-es', version: '1.0.0' }));

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
    console.log('   GET  /api/intents           — Listar intenciones');
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
