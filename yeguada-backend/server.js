
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Chatbot Backend
// Stack: Express + node-nlp (NaturalLanguageProcessorEs)
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const { NlpManager } = require('node-nlp');

const app = express();
app.use(cors());
app.use(express.json());

// ── Métricas en memoria ──
const metrics = {
  totalChats: 0,
  resolvedByBot: 0,
  escalatedToHuman: 0,
  totalResponseTimeMs: 0,
  intentCounts: {},
  recentConversations: [],
};

// ── Inicializar NLP Manager ──
const manager = new NlpManager({ languages: ['es'], forceNER: true });

// ╔══════════════════════════════════════════════╗
// ║   ENTRENAMIENTO — Intenciones La Yeguada     ║
// ╚══════════════════════════════════════════════╝

// 1. RESERVA DE TOURS
manager.addDocument('es', 'quiero reservar un tour', 'booking.tour');
manager.addDocument('es', 'cómo puedo hacer una reserva', 'booking.tour');
manager.addDocument('es', 'me gustaría reservar', 'booking.tour');
manager.addDocument('es', 'quiero hacer un tour', 'booking.tour');
manager.addDocument('es', 'reservar para el fin de semana', 'booking.tour');
manager.addDocument('es', 'quisiera apartar un cupo', 'booking.tour');
manager.addDocument('es', 'cómo reservo para un grupo', 'booking.tour');
manager.addDocument('es', 'quiero apartar un tour para el sábado', 'booking.tour');
manager.addDocument('es', 'proceso de reserva', 'booking.tour');
manager.addDocument('es', 'quiero ir a la yeguada', 'booking.tour');
manager.addAnswer('es', 'booking.tour', 'Para reservar un tour en La Yeguada OBC, contáctenos por WhatsApp al +507 6XXX-XXXX o escríbanos al correo info@ecoturismolayeguada.com. Ofrecemos tours guiados de senderismo, cascadas y agroturismo. Se recomienda reservar con 48h de anticipación. ¿Le gustaría saber más sobre algún tour en específico?');

// 2. PRECIOS Y TARIFAS
manager.addDocument('es', 'cuánto cuesta el tour', 'pricing.info');
manager.addDocument('es', 'cuál es el precio', 'pricing.info');
manager.addDocument('es', 'qué tarifa tienen', 'pricing.info');
manager.addDocument('es', 'precio de las actividades', 'pricing.info');
manager.addDocument('es', 'cuánto cobran', 'pricing.info');
manager.addDocument('es', 'costo de entrada', 'pricing.info');
manager.addDocument('es', 'tienen algún descuento', 'pricing.info');
manager.addDocument('es', 'precio para niños', 'pricing.info');
manager.addDocument('es', 'tarifa grupal', 'pricing.info');
manager.addAnswer('es', 'pricing.info', '💰 Nuestros precios son:\n🥾 Tour Senderismo Básico: $25/persona\n🌊 Tour Cascadas Celestes: $35/persona\n🌿 Tour Completo (cascadas + almuerzo típico): $45/persona\n\nGrupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico?');

// 3. DISPONIBILIDAD DE GUÍA
manager.addDocument('es', 'hay guías disponibles', 'guide.availability');
manager.addDocument('es', 'necesito un guía', 'guide.availability');
manager.addDocument('es', 'cuándo está disponible el guía', 'guide.availability');
manager.addDocument('es', 'tienen guía en español', 'guide.availability');
manager.addDocument('es', 'disponibilidad de guías', 'guide.availability');
manager.addDocument('es', 'guías certificados', 'guide.availability');
manager.addDocument('es', 'quiero contratar un guía', 'guide.availability');
manager.addAnswer('es', 'guide.availability', '🧭 Contamos con guías comunitarios certificados. La disponibilidad varía según la temporada:\n🌅 Temporada alta (dic-abr): reserve con 1 semana de anticipación\n🌧️ Temporada baja (may-nov): mayor disponibilidad\n\nTodos nuestros guías son locales y conocen la flora, fauna y tradiciones del lugar. ¿Para qué fecha necesita el servicio?');

// 4. INFORMACIÓN GENERAL
manager.addDocument('es', 'qué actividades ofrecen', 'general.info');
manager.addDocument('es', 'qué hay para hacer en la yeguada', 'general.info');
manager.addDocument('es', 'información sobre ecoturismo la yeguada', 'general.info');
manager.addDocument('es', 'qué es ecoturismo la yeguada obc', 'general.info');
manager.addDocument('es', 'qué experiencias tienen', 'general.info');
manager.addDocument('es', 'cuéntame sobre la yeguada', 'general.info');
manager.addAnswer('es', 'general.info', '🌿 Ecoturismo La Yeguada OBC es una organización de base comunitaria ubicada en la Reserva Forestal La Yeguada, Calobre, Veraguas, Panamá.\n\nOfrecemos:\n🥾 Senderismo interpretativo\n🌊 Visita a Cascadas Celestes\n🛶 Kayak en la Laguna volcánica\n🌱 Agroturismo y café\n🦜 Avistamiento de aves (200+ especies)\n⛺ Camping\n🎭 Talleres culturales comunitarios\n\n¿Le interesa alguna actividad en particular?');

// 5. CÓMO LLEGAR
manager.addDocument('es', 'cómo llego a la yeguada', 'location.directions');
manager.addDocument('es', 'dónde queda la reserva', 'location.directions');
manager.addDocument('es', 'cómo llegar desde ciudad de panamá', 'location.directions');
manager.addDocument('es', 'dirección de la reserva forestal', 'location.directions');
manager.addDocument('es', 'ubicación de la yeguada', 'location.directions');
manager.addDocument('es', 'cómo se llega en bus', 'location.directions');
manager.addDocument('es', 'cuánto tarda el viaje', 'location.directions');
manager.addAnswer('es', 'location.directions', '📍 La Reserva Forestal La Yeguada está en Calobre, Veraguas.\n\n🚗 En carro: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas desde Ciudad de Panamá). Se recomienda vehículo 4x4.\n\n🚌 En bus: Terminal Albrook → Aguadulce → bus local a La Yeguada (~6 horas).\n\n¿Necesita más detalles sobre el recorrido?');

// 6. CAMPING
manager.addDocument('es', 'puedo acampar ahí', 'camping.info');
manager.addDocument('es', 'tienen área de camping', 'camping.info');
manager.addDocument('es', 'quiero acampar en la yeguada', 'camping.info');
manager.addDocument('es', 'pasar la noche en la reserva', 'camping.info');
manager.addDocument('es', 'se puede dormir en carpas', 'camping.info');
manager.addAnswer('es', 'camping.info', '⛺ ¡Sí ofrecemos camping! Hay dos zonas:\n\n1️⃣ Orillas de la Laguna La Yeguada (más natural, letrinas básicas)\n2️⃣ Estación ANAM con baños, duchas y terreno limpio\n\n⚠️ Capacidad limitada. Reserve con anticipación, especialmente en feriados. No recomendamos visitar el río en temporada de lluvia (may-nov).');

// 7. CASCADAS
manager.addDocument('es', 'dónde están las cascadas celestes', 'waterfall.info');
manager.addDocument('es', 'información sobre las cascadas', 'waterfall.info');
manager.addDocument('es', 'la silampa cascada', 'waterfall.info');
manager.addDocument('es', 'quiero ver las cascadas', 'waterfall.info');
manager.addDocument('es', 'tour a las cascadas', 'waterfall.info');
manager.addAnswer('es', 'waterfall.info', '🌊 Contamos con dos cascadas principales:\n\n💧 Cascadas Celestes: sendero de ~45 min, acceso en 4x4. Incluida en tour $35.\n💧 Cascada La Silampa: caminata de ~1h45 min, paisaje espectacular con cueva. Guía recomendado.\n\nAmbas son impresionantes y perfectas para fotografía y natación en los meses secos.');

// 8. HORARIOS
manager.addDocument('es', 'cuál es el horario de atención', 'hours.info');
manager.addDocument('es', 'a qué hora abren', 'hours.info');
manager.addDocument('es', 'cuándo puedo visitar', 'hours.info');
manager.addDocument('es', 'horario de los tours', 'hours.info');
manager.addAnswer('es', 'hours.info', '⏰ Horarios:\n📅 Atención: lun-dom (vía WhatsApp en horario de oficina)\n🌅 Tours: salen a las 7:00-8:00 AM\n🏞️ Acceso reserva: 7:30 AM - 4:30 PM\n\nSe recomienda llegar temprano para aprovechar el día completo.');

// 9. SALUDO
manager.addDocument('es', 'hola', 'greeting');
manager.addDocument('es', 'buenos días', 'greeting');
manager.addDocument('es', 'buenas tardes', 'greeting');
manager.addDocument('es', 'buenas', 'greeting');
manager.addDocument('es', 'hey', 'greeting');
manager.addAnswer('es', 'greeting', '¡Hola! 👋 Bienvenido al asistente virtual de Ecoturismo La Yeguada OBC. Estoy aquí para ayudarte con información sobre nuestros tours, precios, cómo llegar y más. ¿En qué puedo asistirte hoy?');

// 10. DESPEDIDA
manager.addDocument('es', 'gracias', 'farewell');
manager.addDocument('es', 'muchas gracias', 'farewell');
manager.addDocument('es', 'hasta luego', 'farewell');
manager.addDocument('es', 'adiós', 'farewell');
manager.addDocument('es', 'chao', 'farewell');
manager.addAnswer('es', 'farewell', '¡Con mucho gusto! 🌿 Esperamos verle pronto en la Reserva Forestal La Yeguada. Para cualquier consulta adicional, estamos disponibles por WhatsApp. ¡Que tenga un excelente día!');

// ── Entrenar y levantar servidor ──
(async () => {
  console.log('Entrenando modelo NLP...');
  await manager.train();
  manager.save();
  console.log('Modelo entrenado y guardado.\n');

  // ── ENDPOINTS ──

  // POST /api/chat — Clasificar mensaje y responder
  app.post('/api/chat', async (req, res) => {
    const start = Date.now();
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'message requerido' });

    const response = await manager.process('es', message);
    const elapsed = Date.now() - start;
    const threshold = 0.7;
    const resolved = response.score >= threshold;

    // Actualizar métricas
    metrics.totalChats++;
    metrics.totalResponseTimeMs += elapsed;
    if (resolved) metrics.resolvedByBot++;
    else metrics.escalatedToHuman++;

    const intentKey = response.intent || 'unknown';
    metrics.intentCounts[intentKey] = (metrics.intentCounts[intentKey] || 0) + 1;

    metrics.recentConversations.unshift({
      sessionId: sessionId || 'anon',
      time: new Date().toISOString(),
      message,
      intent: response.intent,
      score: response.score,
      resolved,
      answer: response.answer,
    });
    if (metrics.recentConversations.length > 50) metrics.recentConversations.pop();

    res.json({
      intent: response.intent,
      score: response.score,
      answer: resolved
        ? response.answer
        : '🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX.',
      resolved,
      escalated: !resolved,
      responseTimeMs: elapsed,
    });
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
    metrics.totalChats = 0;
    metrics.resolvedByBot = 0;
    metrics.escalatedToHuman = 0;
    metrics.totalResponseTimeMs = 0;
    metrics.intentCounts = {};
    metrics.recentConversations = [];
    console.log('🧹 Métricas reseteadas');
    res.json({ ok: true });
  });

  // GET /api/health
  app.get('/api/health', (_, res) => res.json({ status: 'ok', model: 'node-nlp-es', version: '1.0.0' }));

  app.listen(3001, () => {
    console.log('La Yeguada Chatbot Backend corriendo en http://localhost:3001');
    console.log('   POST /api/chat     — Clasificar mensaje');
    console.log('   GET  /api/metrics  — Métricas del dashboard');
    console.log('   GET  /api/intents  — Listar intenciones\n');
  });
})();
