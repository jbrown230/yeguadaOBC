// ─────────────────────────────────────────────────────────────
// Crea el administrador inicial desde variables de entorno
// (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME). Solo actúa si la tabla de
// usuarios está vacía: no pisa ni recrea cuentas existentes.
// ─────────────────────────────────────────────────────────────
const cfg = require('./config');
const store = require('./store');
const { hashPassword, validatePassword } = require('./passwords');

// En producción la BD no puede quedar sin administrador ni con el registro
// abierto por omisión: si no hay usuarios y no se configuró ni ADMIN_* ni
// ALLOW_SETUP=true, el servidor se niega a arrancar.
function assertSafeBoot() {
  if (!cfg.IS_PROD || store.countUsers() > 0) return;
  if (!cfg.SETUP_ENABLED) {
    console.error('❌ Producción sin administradores: define ADMIN_EMAIL y ADMIN_PASSWORD (o ALLOW_SETUP=true temporalmente) y reinicia.');
    process.exit(1);
  }
  console.warn('⚠️  ALLOW_SETUP=true y sin usuarios: cualquiera que abra /login puede crear el administrador. Hazlo ya y quita la variable.');
}

async function seedAdminFromEnv() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && store.countUsers() === 0) await createFromEnv(email, password);
  assertSafeBoot();
}

async function createFromEnv(email, password) {
  const problem = validatePassword(password, { email });
  if (problem) {
    console.error(`⚠️  ADMIN_PASSWORD no cumple la política (${problem}). No se creó el administrador inicial.`);
    return;
  }
  store.createUser({
    email,
    name: (process.env.ADMIN_NAME || 'Administrador').trim().slice(0, 80),
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  console.log(`🔐 Administrador inicial creado desde variables de entorno: ${email}`);
}

module.exports = { seedAdminFromEnv };
