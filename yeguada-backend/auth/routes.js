// ─────────────────────────────────────────────────────────────
// /api/auth/* — setup inicial, login, logout, sesión, recuperación y cambio
// de contraseña. Montado en server.js antes del guard global de /api.
// ─────────────────────────────────────────────────────────────
const express = require('express');
const rateLimit = require('express-rate-limit');
const cfg = require('./config');
const store = require('./store');
const mail = require('../mail');
const {
  hashPassword, verifyPassword, validatePassword, DUMMY_HASH, randomToken,
} = require('./passwords');
const { requireAuth, setSessionCookie, clearSessionCookie } = require('./middleware');

const router = express.Router();

const limiter = (max, windowMin, message) => rateLimit({
  windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { error: message, code: 'rate_limited' },
});
const loginLimiter = limiter(10, 15, 'Demasiados intentos. Intenta de nuevo en unos minutos.');
const mailLimiter = limiter(5, 15, 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normEmail = (v) => String(v || '').trim().toLowerCase();
const cleanName = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 80);
const fmtDate = (d) => d.toLocaleString('es-PA', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Panama' });

function startSession(req, res, userId) {
  const token = randomToken();
  store.createSession({ token, userId, ttlMs: cfg.SESSION_TTL_MS, ip: req.ip, userAgent: req.get('user-agent') });
  setSessionCookie(res, token);
}

// GET /api/auth/status — ¿ya hay sesión? ¿hace falta crear el primer admin?
router.get('/status', (req, res) => {
  res.json({ user: req.user || null, needsSetup: cfg.SETUP_ENABLED && store.countUsers() === 0 });
});

// POST /api/auth/setup — crea el primer administrador (solo si no hay usuarios)
router.post('/setup', loginLimiter, async (req, res) => {
  if (!cfg.SETUP_ENABLED) return res.status(403).json({ error: 'La creación de administrador está deshabilitada' });
  if (store.countUsers() > 0) return res.status(403).json({ error: 'La configuración inicial ya fue completada' });
  const email = normEmail(req.body.email), name = cleanName(req.body.name), password = req.body.password;
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Correo no válido' });
  if (name.length < 2) return res.status(400).json({ error: 'Ingresa tu nombre' });
  const pwError = validatePassword(password, { email });
  if (pwError) return res.status(400).json({ error: pwError });

  const user = store.createUser({ email, name, passwordHash: await hashPassword(password), role: 'admin' });
  startSession(req, res, user.id);
  mail.sendWelcome(user, { loginUrl: cfg.APP_URL }).catch((e) => console.error('mail welcome:', e.message));
  res.status(201).json({ user: store.publicUser(user) });
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const email = normEmail(req.body.email), password = String(req.body.password || '');
  const GENERIC = { error: 'Correo o contraseña incorrectos' };
  const user = EMAIL_RE.test(email) ? store.findUserByEmail(email) : null;

  if (!user) {
    await verifyPassword(password, await DUMMY_HASH); // iguala el tiempo de respuesta
    return res.status(401).json(GENERIC);
  }
  if (user.locked_until && user.locked_until > new Date().toISOString()) {
    return res.status(423).json({ error: 'Cuenta bloqueada temporalmente por intentos fallidos. Inténtalo más tarde.', code: 'locked' });
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    const locked = store.recordLoginFailure(user.id, { maxAttempts: cfg.MAX_FAILED_ATTEMPTS, lockMs: cfg.LOCK_MS });
    return locked
      ? res.status(423).json({ error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.', code: 'locked' })
      : res.status(401).json(GENERIC);
  }
  store.recordLoginSuccess(user.id);
  startSession(req, res, user.id);
  res.json({ user: store.publicUser(user) });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.sessionToken) store.deleteSession(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

// POST /api/auth/forgot-password — siempre responde igual (no revela qué correos existen)
router.post('/forgot-password', mailLimiter, async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Correo no válido' });

  const user = store.findUserByEmail(email);
  if (user) {
    const token = randomToken();
    store.createReset({ token, userId: user.id, ttlMs: cfg.RESET_TTL_MS });
    const url = `${cfg.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
    // Sin await: el tiempo de respuesta no delata si el correo existe.
    mail.sendPasswordReset(user, { url, minutes: Math.round(cfg.RESET_TTL_MS / 60000) })
      .catch((e) => console.error('mail reset:', e.message));
  }
  res.json({ ok: true });
});

// GET /api/auth/reset-password/:token — valida el enlace antes de mostrar el formulario
router.get('/reset-password/:token', (req, res) => {
  res.json({ valid: !!store.findValidReset(req.params.token) });
});

// POST /api/auth/reset-password
router.post('/reset-password', mailLimiter, async (req, res) => {
  const { token, password } = req.body;
  const reset = typeof token === 'string' && store.findValidReset(token);
  if (!reset) return res.status(400).json({ error: 'El enlace no es válido o ya expiró. Solicita uno nuevo.', code: 'invalid_token' });

  const user = store.findUserById(reset.user_id);
  const pwError = validatePassword(password, { email: user.email });
  if (pwError) return res.status(400).json({ error: pwError });

  if (!store.consumeReset(token)) return res.status(400).json({ error: 'El enlace ya fue utilizado.', code: 'invalid_token' });
  store.setPassword(user.id, await hashPassword(password));
  store.deleteUserSessions(user.id); // cierra todas las sesiones previas
  mail.sendPasswordChanged(user, { when: fmtDate(new Date()), loginUrl: `${cfg.APP_URL}/login` })
    .catch((e) => console.error('mail changed:', e.message));
  res.json({ ok: true });
});

// POST /api/auth/change-password — usuario autenticado
router.post('/change-password', requireAuth, loginLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = store.findUserById(req.user.id);
  if (!(await verifyPassword(String(currentPassword || ''), user.password_hash))) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  }
  if (newPassword === currentPassword) return res.status(400).json({ error: 'Elige una contraseña distinta a la actual' });
  const pwError = validatePassword(newPassword, { email: user.email });
  if (pwError) return res.status(400).json({ error: pwError });

  store.setPassword(user.id, await hashPassword(newPassword));
  store.deleteUserSessions(user.id, req.sessionToken); // conserva solo la sesión actual
  mail.sendPasswordChanged(user, { when: fmtDate(new Date()), loginUrl: `${cfg.APP_URL}/login` })
    .catch((e) => console.error('mail changed:', e.message));
  res.json({ ok: true });
});

module.exports = router;
