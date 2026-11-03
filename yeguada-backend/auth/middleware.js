const cfg = require('./config');
const store = require('./store');

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* cookie corrupta */ }
    }
  }
  return out;
}

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', secure: cfg.IS_PROD, path: '/' };

const setSessionCookie = (res, token) =>
  res.cookie(cfg.COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: cfg.SESSION_TTL_MS });
const clearSessionCookie = (res) => res.clearCookie(cfg.COOKIE_NAME, COOKIE_OPTS);

// Carga req.user / req.sessionToken si hay una sesión válida (no bloquea).
function loadSession(req, res, next) {
  const token = parseCookies(req.headers.cookie)[cfg.COOKIE_NAME];
  if (token) {
    const row = store.findSession(token);
    if (row) {
      req.user = store.publicUser(row);
      req.sessionToken = token;
      // Sesión deslizante: se renueva como mucho una vez por hora.
      if (Date.parse(row.expires_at) < Date.now() + cfg.SESSION_TTL_MS - 3600 * 1000) {
        store.extendSession(token, cfg.SESSION_TTL_MS);
        setSessionCookie(res, token);
      }
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sesión no válida o expirada', code: 'unauthenticated' });
  next();
}

// Con contraseña temporal solo se permite /api/auth/* (cambiar contraseña, cerrar sesión).
function requirePasswordSet(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sesión no válida o expirada', code: 'unauthenticated' });
  if (req.user.mustChangePassword) return res.status(403).json({ error: 'Debes cambiar tu contraseña temporal', code: 'password_change_required' });
  next();
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Sin permisos', code: 'forbidden' });

module.exports = { loadSession, requireAuth, requirePasswordSet, requireRole, setSessionCookie, clearSessionCookie };
