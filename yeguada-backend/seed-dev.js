// ─────────────────────────────────────────────────────────────
// Datos de prueba para desarrollo local:  npm run seed
//   · Crea (o RESTABLECE la contraseña de) un administrador demo.
//   · Si no hay conversaciones, genera ~30 días de historial realista
//     (dashboard, gráficos, escalamientos pendientes y atendidos).
//   · `npm run seed -- --reset` borra las conversaciones y las regenera.
// Nunca corre con NODE_ENV=production.
// ─────────────────────────────────────────────────────────────
require('./env');
if (process.env.NODE_ENV === 'production') {
  console.error('❌ seed-dev.js no se ejecuta en producción.');
  process.exit(1);
}

const db = require('./db');
const store = require('./auth/store');
const crypto = require('crypto');
const { hashPassword, validatePassword } = require('./auth/passwords');

// Credenciales de los usuarios demo: SEED_ADMIN_* y SEED_OPERATOR_* en yeguada-backend/.env.
// Si no hay contraseña definida se genera una aleatoria y se muestra UNA vez al final.
const DEMO_USERS = [
  { key: 'ADMIN', email: process.env.SEED_ADMIN_EMAIL || 'demo@yeguada.local', name: 'Admin Demo', role: 'admin', password: process.env.SEED_ADMIN_PASSWORD },
  { key: 'OPERATOR', email: process.env.SEED_OPERATOR_EMAIL || 'operador@yeguada.local', name: 'Operador Demo', role: 'operador', password: process.env.SEED_OPERATOR_PASSWORD },
];
for (const u of DEMO_USERS) {
  u.generated = !u.password;
  if (u.generated) u.password = `${crypto.randomBytes(9).toString('base64url')}7a`; // letras + dígitos
  const problem = validatePassword(u.password, { email: u.email });
  if (problem) { console.error(`❌ SEED_${u.key}_PASSWORD no es válida: ${problem}`); process.exit(1); }
}

// Preguntas realistas por intención (la respuesta sale de la intención sembrada).
const PHRASES = {
  'booking.tour': ['Quiero reservar un tour para el sábado', 'Cómo hago una reserva para 6 personas?', 'Tienen cupo este fin de semana?'],
  'pricing.info': ['Cuánto cuesta el tour a las cascadas?', 'Tienen descuento para estudiantes?', 'Precio por persona?'],
  'guide.availability': ['Hay guías disponibles en diciembre?', 'Necesito un guía en español', 'Los guías están certificados?'],
  'general.info': ['Qué actividades ofrecen?', 'Cuéntame sobre la yeguada', 'Qué hay para hacer ahí?'],
  'location.directions': ['Cómo llego desde Ciudad de Panamá?', 'Dónde queda la reserva?', 'Cuánto tarda el viaje en bus?'],
  'camping.info': ['Se puede acampar?', 'Tienen área de camping con baños?'],
  'waterfall.info': ['Dónde están las Cascadas Celestes?', 'Cuánto se camina a La Silampa?'],
  'hours.info': ['A qué hora abren?', 'Atienden los domingos?'],
  greeting: ['Hola', 'Buenas tardes', 'Buen día'],
  farewell: ['Gracias', 'Muchas gracias, hasta luego'],
};
const UNRESOLVED = [
  'Quiero poner una queja por el servicio', 'Aceptan pago con tarjeta de crédito?', 'Hay wifi en la zona?',
  'Cómo va a estar el clima este fin de semana?', 'Hacen factura electrónica?', 'Puedo pedir un reembolso?',
  'Tuve un problema durante la visita', 'Venden souvenirs?',
];
// Peso de cada intención en el volumen total
const WEIGHTS = { 'booking.tour': 22, 'pricing.info': 18, 'general.info': 12, 'location.directions': 12, 'guide.availability': 8, 'waterfall.info': 7, 'camping.info': 6, 'hours.info': 6, greeting: 6, farewell: 3 };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function weighted() {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(WEIGHTS)) { if ((r -= w) <= 0) return k; }
  return 'greeting';
}
const sessionId = (whatsapp) => (whatsapp
  ? `5076${Math.floor(rnd(1000000, 9999999))}@c.us`
  : `web-${Math.random().toString(36).slice(2, 8)}`);

async function seedUsers() {
  for (const u of DEMO_USERS) {
    const hash = await hashPassword(u.password);
    const existing = store.findUserByEmail(u.email);
    if (existing) {
      store.setPassword(existing.id, hash);
      store.updateUser(existing.id, { name: u.name, role: u.role });
      store.deleteUserSessions(existing.id);
      console.log(`🔐 ${u.role} demo existente: contraseña restablecida`);
    } else {
      store.createUser({ email: u.email, name: u.name, passwordHash: hash, role: u.role });
      console.log(`🔐 ${u.role} demo creado`);
    }
  }
}

function seedConversations() {
  const { conn } = db;
  const reset = process.argv.includes('--reset');
  const count = conn.prepare('SELECT COUNT(*) AS n FROM conversations').get().n;
  if (count > 0 && !reset) { console.log(`💬 Ya hay ${count} conversaciones; usa --reset para regenerarlas.`); return; }

  const answers = Object.fromEntries(db.listIntents().map((i) => [i.id, i.answer]));
  const insert = conn.prepare(`
    INSERT INTO conversations (session_id, channel, message, intent, score, resolved, answer, response_time_ms, created_at, handled, handled_at)
    VALUES (@session_id, @channel, @message, @intent, @score, @resolved, @answer, @response_time_ms, @created_at, @handled, @handled_at)`);

  const rows = [];
  const now = Date.now();
  for (let day = 29; day >= 0; day--) {
    const weekend = [0, 6].includes(new Date(now - day * 864e5).getDay());
    const n = Math.round(rnd(4, 9) * (weekend ? 1.7 : 1) * (1 + (30 - day) / 60)); // tendencia creciente
    for (let k = 0; k < n; k++) {
      const whatsapp = Math.random() < 0.6;
      const ts = new Date(now - day * 864e5 - rnd(0, 14) * 36e5 - rnd(0, 36e5)); // dentro del día, sin pasarse de ahora
      if (ts.getTime() > now) continue;
      const base = { session_id: sessionId(whatsapp), channel: whatsapp ? 'whatsapp' : 'dashboard', created_at: ts.toISOString(), response_time_ms: Math.round(rnd(8, 60)), handled: 0, handled_at: null };
      if (Math.random() < 0.14) {
        const handled = day > 1 || Math.random() < 0.3;
        rows.push({ ...base, message: pick(UNRESOLVED), intent: 'fuera.de.alcance', score: +rnd(0.2, 0.62).toFixed(2), resolved: 0, answer: answers['fuera.de.alcance'] || null, handled: handled ? 1 : 0, handled_at: handled ? new Date(ts.getTime() + 36e5).toISOString() : null });
      } else {
        const intent = weighted();
        rows.push({ ...base, message: pick(PHRASES[intent]), intent, score: +rnd(0.72, 0.99).toFixed(2), resolved: 1, answer: answers[intent] || null });
      }
    }
  }
  conn.transaction(() => {
    if (reset) conn.prepare('DELETE FROM conversations').run();
    rows.forEach((r) => insert.run(r));
  })();
  console.log(`💬 ${rows.length} conversaciones de ejemplo generadas`);
}

(async () => {
  await seedUsers();
  seedConversations();
  console.log('\n✅ Listo. Usuarios de desarrollo:');
  DEMO_USERS.forEach((u) => console.log(`   ${u.role.padEnd(9)} ${u.email}  /  ${u.generated ? u.password + '   (generada, anótala: no se vuelve a mostrar)' : '(la de SEED_' + u.key + '_PASSWORD en .env)'}`));
  console.log('');
})();
