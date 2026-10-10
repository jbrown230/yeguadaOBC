// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Persistencia (SQLite)
// Guarda intenciones (+ frases de entrenamiento) y la base de
// conocimiento. Usado por nlp.js (entrenamiento) y server.js (CRUD).
// ─────────────────────────────────────────────────────────────
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS intents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS intent_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent_id TEXT NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
    phrase TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_intent_examples_intent ON intent_examples(intent_id);

  CREATE TABLE IF NOT EXISTS kb_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent_id TEXT REFERENCES intents(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Slug único a partir del nombre (ids legibles tipo 'booking.tour') ──
function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'intent';
  let id = base;
  let n = 2;
  const exists = db.prepare('SELECT 1 FROM intents WHERE id = ?');
  while (exists.get(id)) {
    id = `${base}.${n++}`;
  }
  return id;
}

// ── Seed inicial — migra lo que antes estaba hardcodeado ──
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM intents').get().n;
  if (count > 0) return;

  const SEED_INTENTS = [
    { id: 'booking.tour', name: 'Reserva de Tours',
      examples: ['quiero reservar un tour', 'cómo puedo hacer una reserva', 'me gustaría reservar', 'quiero hacer un tour', 'reservar para el fin de semana', 'quisiera apartar un cupo', 'cómo reservo para un grupo', 'quiero apartar un tour para el sábado', 'proceso de reserva', 'quiero ir a la yeguada', 'tour', 'tours', 'reserva', 'reservas', 'reservar', 'quiero un tour'],
      answer: 'Para reservar un tour en La Yeguada OBC, contáctenos por WhatsApp al +507 6XXX-XXXX o escríbanos al correo info@ecoturismolayeguada.com. Ofrecemos tours guiados de senderismo, cascadas y agroturismo. Se recomienda reservar con 48h de anticipación. ¿Le gustaría saber más sobre algún tour en específico?' },
    { id: 'pricing.info', name: 'Precios y Tarifas',
      examples: ['cuánto cuesta el tour', 'cuál es el precio', 'qué tarifa tienen', 'precio de las actividades', 'cuánto cobran', 'costo de entrada', 'tienen algún descuento', 'precio para niños', 'tarifa grupal', 'precio', 'precios', 'costo', 'costos', 'tarifa', 'tarifas'],
      answer: '💰 Nuestros precios son:\n🥾 Tour Senderismo Básico: $25/persona\n🌊 Tour Cascadas Celestes: $35/persona\n🌿 Tour Completo (cascadas + almuerzo típico): $45/persona\n\nGrupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico?' },
    { id: 'guide.availability', name: 'Disponibilidad de Guía',
      examples: ['hay guías disponibles', 'necesito un guía', 'cuándo está disponible el guía', 'tienen guía en español', 'disponibilidad de guías', 'guías certificados', 'quiero contratar un guía', 'guía', 'guías', 'guia', 'guias'],
      answer: '🧭 Contamos con guías comunitarios certificados. La disponibilidad varía según la temporada:\n🌅 Temporada alta (dic-abr): reserve con 1 semana de anticipación\n🌧️ Temporada baja (may-nov): mayor disponibilidad\n\nTodos nuestros guías son locales y conocen la flora, fauna y tradiciones del lugar. ¿Para qué fecha necesita el servicio?' },
    { id: 'general.info', name: 'Información General',
      examples: ['qué actividades ofrecen', 'qué hay para hacer en la yeguada', 'información sobre ecoturismo la yeguada', 'qué es ecoturismo la yeguada obc', 'qué experiencias tienen', 'cuéntame sobre la yeguada', 'información', 'info', 'actividades', 'ecoturismo'],
      answer: '🌿 Ecoturismo La Yeguada OBC es una organización de base comunitaria ubicada en la Reserva Forestal La Yeguada, Calobre, Veraguas, Panamá.\n\nOfrecemos:\n🥾 Senderismo interpretativo\n🌊 Visita a Cascadas Celestes\n🛶 Kayak en la Laguna volcánica\n🌱 Agroturismo y café\n🦜 Avistamiento de aves (200+ especies)\n⛺ Camping\n🎭 Talleres culturales comunitarios\n\n¿Le interesa alguna actividad en particular?' },
    { id: 'location.directions', name: 'Cómo Llegar',
      examples: ['cómo llego a la yeguada', 'dónde queda la reserva', 'cómo llegar desde ciudad de panamá', 'dirección de la reserva forestal', 'ubicación de la yeguada', 'cómo se llega en bus', 'cuánto tarda el viaje', 'ubicación', 'dirección', 'llegar', 'cómo llegar'],
      answer: '📍 La Reserva Forestal La Yeguada está en Calobre, Veraguas.\n\n🚗 En carro: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas desde Ciudad de Panamá). Se recomienda vehículo 4x4.\n\n🚌 En bus: Terminal Albrook → Aguadulce → bus local a La Yeguada (~6 horas).\n\n¿Necesita más detalles sobre el recorrido?' },
    { id: 'camping.info', name: 'Camping',
      examples: ['puedo acampar ahí', 'tienen área de camping', 'quiero acampar en la yeguada', 'pasar la noche en la reserva', 'se puede dormir en carpas', 'camping', 'acampar', 'carpa'],
      answer: '⛺ ¡Sí ofrecemos camping! Hay dos zonas:\n\n1️⃣ Orillas de la Laguna La Yeguada (más natural, letrinas básicas)\n2️⃣ Estación ANAM con baños, duchas y terreno limpio\n\n⚠️ Capacidad limitada. Reserve con anticipación, especialmente en feriados. No recomendamos visitar el río en temporada de lluvia (may-nov).' },
    { id: 'waterfall.info', name: 'Cascadas',
      examples: ['dónde están las cascadas celestes', 'información sobre las cascadas', 'la silampa cascada', 'quiero ver las cascadas', 'tour a las cascadas', 'cascada', 'cascadas', 'silampa'],
      answer: '🌊 Contamos con dos cascadas principales:\n\n💧 Cascadas Celestes: sendero de ~45 min, acceso en 4x4. Incluida en tour $35.\n💧 Cascada La Silampa: caminata de ~1h45 min, paisaje espectacular con cueva. Guía recomendado.\n\nAmbas son impresionantes y perfectas para fotografía y natación en los meses secos.' },
    { id: 'hours.info', name: 'Horarios',
      examples: ['cuál es el horario de atención', 'a qué hora abren', 'cuándo puedo visitar', 'horario de los tours', 'horario', 'horarios', 'hora'],
      answer: '⏰ Horarios:\n📅 Atención: lun-dom (vía WhatsApp en horario de oficina)\n🌅 Tours: salen a las 7:00-8:00 AM\n🏞️ Acceso reserva: 7:30 AM - 4:30 PM\n\nSe recomienda llegar temprano para aprovechar el día completo.' },
    { id: 'greeting', name: 'Saludos',
      examples: ['hola', 'buenos días', 'buenas tardes', 'buenas', 'hey', 'buen día', 'qué tal', 'saludos'],
      answer: '¡Hola! 👋 Bienvenido al asistente virtual de Ecoturismo La Yeguada OBC. Estoy aquí para ayudarte con información sobre nuestros tours, precios, cómo llegar y más. ¿En qué puedo asistirte hoy?' },
    { id: 'farewell', name: 'Despedidas',
      examples: ['gracias', 'muchas gracias', 'hasta luego', 'adiós', 'chao', 'nos vemos', 'bye'],
      answer: '¡Con mucho gusto! 🌿 Esperamos verle pronto en la Reserva Forestal La Yeguada. Para cualquier consulta adicional, estamos disponibles por WhatsApp. ¡Que tenga un excelente día!' },
  ];

  const SEED_KB = [
    { intentId: 'booking.tour', question: '¿Cómo puedo reservar un tour en La Yeguada?', answer: 'Para reservar un tour, contáctenos por WhatsApp al +507 6XXX-XXXX. Reserve con al menos 48h de anticipación.', tags: ['tours', 'reserva', 'WhatsApp'] },
    { intentId: 'pricing.info', question: '¿Cuáles son los precios de los tours?', answer: 'Senderismo básico: $25/persona. Cascadas: $35/persona. Tour completo + almuerzo: $45/persona. Grupos 8+: 15% descuento.', tags: ['precios', 'tours'] },
    { intentId: 'location.directions', question: '¿Cómo llego a la Reserva Forestal La Yeguada?', answer: 'Desde Ciudad de Panamá: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas). Se recomienda 4x4.', tags: ['cómo llegar', 'ubicación'] },
    { intentId: 'general.info', question: '¿Qué actividades ofrece Ecoturismo La Yeguada OBC?', answer: 'Senderismo, Cascadas Celestes, kayak en la Laguna volcánica, agroturismo, avistamiento de aves (200+ sp.), camping y talleres culturales.', tags: ['actividades', 'tours'] },
    { intentId: 'camping.info', question: '¿Se puede acampar en La Yeguada?', answer: 'Sí. Zona natural a orillas de la Laguna y Estación ANAM con baños/duchas. Capacidad limitada — reserve con anticipación.', tags: ['camping', 'noche'] },
    { intentId: 'waterfall.info', question: '¿Cómo visito las Cascadas Celestes?', answer: 'Sendero ~45 min, incluida en tour $35. La Cascada La Silampa requiere ~1h45 con guía.', tags: ['cascadas', 'senderismo'] },
  ];

  const insertIntent = db.prepare('INSERT INTO intents (id, name, answer) VALUES (?, ?, ?)');
  const insertExample = db.prepare('INSERT INTO intent_examples (intent_id, phrase) VALUES (?, ?)');
  const insertKb = db.prepare('INSERT INTO kb_entries (intent_id, question, answer, tags) VALUES (?, ?, ?, ?)');

  db.transaction(() => {
    for (const intent of SEED_INTENTS) {
      insertIntent.run(intent.id, intent.name, intent.answer);
      for (const phrase of intent.examples) insertExample.run(intent.id, phrase);
    }
    for (const entry of SEED_KB) {
      insertKb.run(entry.intentId, entry.question, entry.answer, JSON.stringify(entry.tags));
    }
  })();

  console.log(`🌱 Base de datos inicializada con ${SEED_INTENTS.length} intenciones y ${SEED_KB.length} entradas de conocimiento.`);
}

seedIfEmpty();

// ── Intenciones ──
function listIntents() {
  const intents = db.prepare('SELECT * FROM intents ORDER BY created_at').all();
  const examplesStmt = db.prepare('SELECT phrase FROM intent_examples WHERE intent_id = ? ORDER BY id');
  return intents.map((intent) => ({
    ...intent,
    examples: examplesStmt.all(intent.id).map((r) => r.phrase),
  }));
}

function getIntent(id) {
  const intent = db.prepare('SELECT * FROM intents WHERE id = ?').get(id);
  if (!intent) return null;
  const examples = db.prepare('SELECT phrase FROM intent_examples WHERE intent_id = ? ORDER BY id').all(id).map((r) => r.phrase);
  return { ...intent, examples };
}

function createIntent({ name, answer, examples }) {
  const id = slugify(name);
  db.transaction(() => {
    db.prepare('INSERT INTO intents (id, name, answer) VALUES (?, ?, ?)').run(id, name, answer);
    const insertExample = db.prepare('INSERT INTO intent_examples (intent_id, phrase) VALUES (?, ?)');
    for (const phrase of examples) insertExample.run(id, phrase);
  })();
  return getIntent(id);
}

function updateIntent(id, { name, answer, examples }) {
  const existing = db.prepare('SELECT 1 FROM intents WHERE id = ?').get(id);
  if (!existing) throw new Error(`Intención '${id}' no encontrada`);

  db.transaction(() => {
    db.prepare("UPDATE intents SET name = ?, answer = ?, updated_at = datetime('now') WHERE id = ?").run(name, answer, id);
    if (examples) {
      db.prepare('DELETE FROM intent_examples WHERE intent_id = ?').run(id);
      const insertExample = db.prepare('INSERT INTO intent_examples (intent_id, phrase) VALUES (?, ?)');
      for (const phrase of examples) insertExample.run(id, phrase);
    }
  })();
  return getIntent(id);
}

function deleteIntent(id) {
  const result = db.prepare('DELETE FROM intents WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Intención '${id}' no encontrada`);
}

// ── Base de conocimiento ──
function rowToKb(row) {
  return { ...row, tags: JSON.parse(row.tags) };
}

function listKb() {
  return db.prepare('SELECT * FROM kb_entries ORDER BY created_at DESC').all().map(rowToKb);
}

function createKb({ intentId, question, answer, tags }) {
  const result = db.prepare('INSERT INTO kb_entries (intent_id, question, answer, tags) VALUES (?, ?, ?, ?)')
    .run(intentId || null, question, answer, JSON.stringify(tags || []));
  return rowToKb(db.prepare('SELECT * FROM kb_entries WHERE id = ?').get(result.lastInsertRowid));
}

function updateKb(id, { intentId, question, answer, tags }) {
  const existing = db.prepare('SELECT 1 FROM kb_entries WHERE id = ?').get(id);
  if (!existing) throw new Error(`Entrada '${id}' no encontrada`);
  db.prepare('UPDATE kb_entries SET intent_id = ?, question = ?, answer = ?, tags = ? WHERE id = ?')
    .run(intentId || null, question, answer, JSON.stringify(tags || []), id);
  return rowToKb(db.prepare('SELECT * FROM kb_entries WHERE id = ?').get(id));
}

function deleteKb(id) {
  const result = db.prepare('DELETE FROM kb_entries WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Entrada '${id}' no encontrada`);
}

module.exports = {
  listIntents, getIntent, createIntent, updateIntent, deleteIntent,
  listKb, createKb, updateKb, deleteKb,
};
