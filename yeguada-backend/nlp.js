
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Motor NLP compartido
// Usado por server.js (dashboard) y whatsapp.js (bot WhatsApp)
// ─────────────────────────────────────────────────────────────
const { NlpManager } = require('node-nlp');

// ── Métricas en memoria (compartidas entre canales) ──
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
manager.addDocument('es', 'tour', 'booking.tour');
manager.addDocument('es', 'tours', 'booking.tour');
manager.addDocument('es', 'reserva', 'booking.tour');
manager.addDocument('es', 'reservas', 'booking.tour');
manager.addDocument('es', 'reservar', 'booking.tour');
manager.addDocument('es', 'quiero un tour', 'booking.tour');
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
manager.addDocument('es', 'precio', 'pricing.info');
manager.addDocument('es', 'precios', 'pricing.info');
manager.addDocument('es', 'costo', 'pricing.info');
manager.addDocument('es', 'costos', 'pricing.info');
manager.addDocument('es', 'tarifa', 'pricing.info');
manager.addDocument('es', 'tarifas', 'pricing.info');
manager.addAnswer('es', 'pricing.info', '💰 Nuestros precios son:\n🥾 Tour Senderismo Básico: $25/persona\n🌊 Tour Cascadas Celestes: $35/persona\n🌿 Tour Completo (cascadas + almuerzo típico): $45/persona\n\nGrupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico?');

// 3. DISPONIBILIDAD DE GUÍA
manager.addDocument('es', 'hay guías disponibles', 'guide.availability');
manager.addDocument('es', 'necesito un guía', 'guide.availability');
manager.addDocument('es', 'cuándo está disponible el guía', 'guide.availability');
manager.addDocument('es', 'tienen guía en español', 'guide.availability');
manager.addDocument('es', 'disponibilidad de guías', 'guide.availability');
manager.addDocument('es', 'guías certificados', 'guide.availability');
manager.addDocument('es', 'quiero contratar un guía', 'guide.availability');
manager.addDocument('es', 'guía', 'guide.availability');
manager.addDocument('es', 'guías', 'guide.availability');
manager.addDocument('es', 'guia', 'guide.availability');
manager.addDocument('es', 'guias', 'guide.availability');
manager.addAnswer('es', 'guide.availability', '🧭 Contamos con guías comunitarios certificados. La disponibilidad varía según la temporada:\n🌅 Temporada alta (dic-abr): reserve con 1 semana de anticipación\n🌧️ Temporada baja (may-nov): mayor disponibilidad\n\nTodos nuestros guías son locales y conocen la flora, fauna y tradiciones del lugar. ¿Para qué fecha necesita el servicio?');

// 4. INFORMACIÓN GENERAL
manager.addDocument('es', 'qué actividades ofrecen', 'general.info');
manager.addDocument('es', 'qué hay para hacer en la yeguada', 'general.info');
manager.addDocument('es', 'información sobre ecoturismo la yeguada', 'general.info');
manager.addDocument('es', 'qué es ecoturismo la yeguada obc', 'general.info');
manager.addDocument('es', 'qué experiencias tienen', 'general.info');
manager.addDocument('es', 'cuéntame sobre la yeguada', 'general.info');
manager.addDocument('es', 'información', 'general.info');
manager.addDocument('es', 'info', 'general.info');
manager.addDocument('es', 'actividades', 'general.info');
manager.addDocument('es', 'ecoturismo', 'general.info');
manager.addAnswer('es', 'general.info', '🌿 Ecoturismo La Yeguada OBC es una organización de base comunitaria ubicada en la Reserva Forestal La Yeguada, Calobre, Veraguas, Panamá.\n\nOfrecemos:\n🥾 Senderismo interpretativo\n🌊 Visita a Cascadas Celestes\n🛶 Kayak en la Laguna volcánica\n🌱 Agroturismo y café\n🦜 Avistamiento de aves (200+ especies)\n⛺ Camping\n🎭 Talleres culturales comunitarios\n\n¿Le interesa alguna actividad en particular?');

// 5. CÓMO LLEGAR
manager.addDocument('es', 'cómo llego a la yeguada', 'location.directions');
manager.addDocument('es', 'dónde queda la reserva', 'location.directions');
manager.addDocument('es', 'cómo llegar desde ciudad de panamá', 'location.directions');
manager.addDocument('es', 'dirección de la reserva forestal', 'location.directions');
manager.addDocument('es', 'ubicación de la yeguada', 'location.directions');
manager.addDocument('es', 'cómo se llega en bus', 'location.directions');
manager.addDocument('es', 'cuánto tarda el viaje', 'location.directions');
manager.addDocument('es', 'ubicación', 'location.directions');
manager.addDocument('es', 'dirección', 'location.directions');
manager.addDocument('es', 'llegar', 'location.directions');
manager.addDocument('es', 'cómo llegar', 'location.directions');
manager.addAnswer('es', 'location.directions', '📍 La Reserva Forestal La Yeguada está en Calobre, Veraguas.\n\n🚗 En carro: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas desde Ciudad de Panamá). Se recomienda vehículo 4x4.\n\n🚌 En bus: Terminal Albrook → Aguadulce → bus local a La Yeguada (~6 horas).\n\n¿Necesita más detalles sobre el recorrido?');

// 6. CAMPING
manager.addDocument('es', 'puedo acampar ahí', 'camping.info');
manager.addDocument('es', 'tienen área de camping', 'camping.info');
manager.addDocument('es', 'quiero acampar en la yeguada', 'camping.info');
manager.addDocument('es', 'pasar la noche en la reserva', 'camping.info');
manager.addDocument('es', 'se puede dormir en carpas', 'camping.info');
manager.addDocument('es', 'camping', 'camping.info');
manager.addDocument('es', 'acampar', 'camping.info');
manager.addDocument('es', 'carpa', 'camping.info');
manager.addAnswer('es', 'camping.info', '⛺ ¡Sí ofrecemos camping! Hay dos zonas:\n\n1️⃣ Orillas de la Laguna La Yeguada (más natural, letrinas básicas)\n2️⃣ Estación ANAM con baños, duchas y terreno limpio\n\n⚠️ Capacidad limitada. Reserve con anticipación, especialmente en feriados. No recomendamos visitar el río en temporada de lluvia (may-nov).');

// 7. CASCADAS
manager.addDocument('es', 'dónde están las cascadas celestes', 'waterfall.info');
manager.addDocument('es', 'información sobre las cascadas', 'waterfall.info');
manager.addDocument('es', 'la silampa cascada', 'waterfall.info');
manager.addDocument('es', 'quiero ver las cascadas', 'waterfall.info');
manager.addDocument('es', 'tour a las cascadas', 'waterfall.info');
manager.addDocument('es', 'cascada', 'waterfall.info');
manager.addDocument('es', 'cascadas', 'waterfall.info');
manager.addDocument('es', 'silampa', 'waterfall.info');
manager.addAnswer('es', 'waterfall.info', '🌊 Contamos con dos cascadas principales:\n\n💧 Cascadas Celestes: sendero de ~45 min, acceso en 4x4. Incluida en tour $35.\n💧 Cascada La Silampa: caminata de ~1h45 min, paisaje espectacular con cueva. Guía recomendado.\n\nAmbas son impresionantes y perfectas para fotografía y natación en los meses secos.');

// 8. HORARIOS
manager.addDocument('es', 'cuál es el horario de atención', 'hours.info');
manager.addDocument('es', 'a qué hora abren', 'hours.info');
manager.addDocument('es', 'cuándo puedo visitar', 'hours.info');
manager.addDocument('es', 'horario de los tours', 'hours.info');
manager.addDocument('es', 'horario', 'hours.info');
manager.addDocument('es', 'horarios', 'hours.info');
manager.addDocument('es', 'hora', 'hours.info');
manager.addAnswer('es', 'hours.info', '⏰ Horarios:\n📅 Atención: lun-dom (vía WhatsApp en horario de oficina)\n🌅 Tours: salen a las 7:00-8:00 AM\n🏞️ Acceso reserva: 7:30 AM - 4:30 PM\n\nSe recomienda llegar temprano para aprovechar el día completo.');

// 9. SALUDO
manager.addDocument('es', 'hola', 'greeting');
manager.addDocument('es', 'buenos días', 'greeting');
manager.addDocument('es', 'buenas tardes', 'greeting');
manager.addDocument('es', 'buenas', 'greeting');
manager.addDocument('es', 'hey', 'greeting');
manager.addDocument('es', 'buen día', 'greeting');
manager.addDocument('es', 'qué tal', 'greeting');
manager.addDocument('es', 'saludos', 'greeting');
manager.addAnswer('es', 'greeting', '¡Hola! 👋 Bienvenido al asistente virtual de Ecoturismo La Yeguada OBC. Estoy aquí para ayudarte con información sobre nuestros tours, precios, cómo llegar y más. ¿En qué puedo asistirte hoy?');

// 10. DESPEDIDA
manager.addDocument('es', 'gracias', 'farewell');
manager.addDocument('es', 'muchas gracias', 'farewell');
manager.addDocument('es', 'hasta luego', 'farewell');
manager.addDocument('es', 'adiós', 'farewell');
manager.addDocument('es', 'chao', 'farewell');
manager.addDocument('es', 'nos vemos', 'farewell');
manager.addDocument('es', 'bye', 'farewell');
manager.addAnswer('es', 'farewell', '¡Con mucho gusto! 🌿 Esperamos verle pronto en la Reserva Forestal La Yeguada. Para cualquier consulta adicional, estamos disponibles por WhatsApp. ¡Que tenga un excelente día!');

const ESCALATION_MESSAGE = '🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX.';
const RESOLUTION_THRESHOLD = 0.7;

async function trainModel() {
  console.log('Entrenando modelo NLP...');
  await manager.train();
  manager.save();
  console.log('Modelo entrenado y guardado.\n');
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
  const resolved = response.intent !== 'None' && response.score >= RESOLUTION_THRESHOLD;

  metrics.totalChats++;
  metrics.totalResponseTimeMs += elapsed;
  if (resolved) metrics.resolvedByBot++;
  else metrics.escalatedToHuman++;

  const intentKey = response.intent || 'unknown';
  metrics.intentCounts[intentKey] = (metrics.intentCounts[intentKey] || 0) + 1;

  metrics.recentConversations.unshift({
    sessionId: sessionId || 'anon',
    channel,
    time: new Date().toISOString(),
    message,
    intent: response.intent,
    score: response.score,
    resolved,
    answer: response.answer,
  });
  if (metrics.recentConversations.length > 50) metrics.recentConversations.pop();

  return {
    intent: response.intent,
    score: response.score,
    answer: resolved ? response.answer : ESCALATION_MESSAGE,
    resolved,
    escalated: !resolved,
    responseTimeMs: elapsed,
  };
}

function resetMetrics() {
  metrics.totalChats = 0;
  metrics.resolvedByBot = 0;
  metrics.escalatedToHuman = 0;
  metrics.totalResponseTimeMs = 0;
  metrics.intentCounts = {};
  metrics.recentConversations = [];
}

module.exports = {
  manager,
  metrics,
  trainModel,
  processMessage,
  resetMetrics,
};
