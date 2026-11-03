// ─────────────────────────────────────────────────────────────
// Acceso a datos de autenticación (usuarios, sesiones, resets).
// Fechas en ISO-8601 UTC: se comparan en JS, no con datetime('now').
// ─────────────────────────────────────────────────────────────
const { conn } = require('../db');
const { sha256 } = require('./passwords');

const iso = (ms) => new Date(ms).toISOString();

const publicUser = (u) => u && ({ id: u.id, email: u.email, name: u.name, role: u.role, mustChangePassword: !!u.must_change_password });

// ── Usuarios ──
const countUsers = () => conn.prepare('SELECT COUNT(*) AS n FROM users').get().n;
const findUserByEmail = (email) => conn.prepare('SELECT * FROM users WHERE email = ?').get(email);
const findUserById = (id) => conn.prepare('SELECT * FROM users WHERE id = ?').get(id);

function createUser({ email, name, passwordHash, role = 'admin', mustChangePassword = false }) {
  const info = conn.prepare('INSERT INTO users (email, name, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?)')
    .run(email, name, passwordHash, role, mustChangePassword ? 1 : 0);
  return findUserById(info.lastInsertRowid);
}

const publicUserFull = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  lastLoginAt: u.last_login_at, createdAt: u.created_at,
});
const listUsers = () => conn.prepare('SELECT * FROM users ORDER BY created_at ASC, id ASC').all().map(publicUserFull);
const countAdmins = () => conn.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n;
const updateUser = (id, { name, role }) =>
  conn.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(name, role, id);
const deleteUser = (id) => conn.prepare('DELETE FROM users WHERE id = ?').run(id);

function setPassword(userId, passwordHash) {
  conn.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    .run(passwordHash, userId);
}

// Contraseña temporal generada por el sistema: obliga a cambiarla en el siguiente ingreso.
const setTemporaryPassword = (userId, passwordHash) =>
  conn.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, failed_attempts = 0, locked_until = NULL WHERE id = ?')
    .run(passwordHash, userId);

function recordLoginSuccess(userId) {
  conn.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?')
    .run(iso(Date.now()), userId);
}

// Devuelve true si la cuenta quedó bloqueada con este intento fallido.
function recordLoginFailure(userId, { maxAttempts, lockMs }) {
  const { failed_attempts: n } = conn.prepare(
    'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ? RETURNING failed_attempts').get(userId);
  if (n < maxAttempts) return false;
  conn.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(iso(Date.now() + lockMs), userId);
  return true;
}

// ── Sesiones ──
function createSession({ token, userId, ttlMs, ip, userAgent }) {
  conn.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)')
    .run(sha256(token), userId, iso(Date.now() + ttlMs), ip || null, (userAgent || '').slice(0, 255));
}

function findSession(token) {
  const row = conn.prepare(`
    SELECT s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?`).get(sha256(token));
  if (!row) return null;
  if (row.expires_at <= iso(Date.now())) { deleteSession(token); return null; }
  return row;
}

const extendSession = (token, ttlMs) =>
  conn.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(iso(Date.now() + ttlMs), sha256(token));
const deleteSession = (token) => conn.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
const deleteUserSessions = (userId, exceptToken) =>
  conn.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, exceptToken ? sha256(exceptToken) : '');
const purgeExpired = () => {
  conn.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(iso(Date.now()));
  conn.prepare('DELETE FROM password_resets WHERE expires_at <= ? OR used_at IS NOT NULL').run(iso(Date.now()));
};

// ── Recuperación de contraseña ──
function createReset({ token, userId, ttlMs }) {
  // Un solo reset vigente por usuario: pedir otro invalida el anterior.
  conn.prepare('DELETE FROM password_resets WHERE user_id = ?').run(userId);
  conn.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, iso(Date.now() + ttlMs));
}

function findValidReset(token) {
  const row = conn.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token));
  if (!row || row.used_at || row.expires_at <= iso(Date.now())) return null;
  return row;
}

// Consumo atómico: si dos requests usan el mismo token, solo uno gana.
const consumeReset = (token) =>
  conn.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ? AND used_at IS NULL')
    .run(iso(Date.now()), sha256(token)).changes === 1;

module.exports = {
  publicUser, publicUserFull, setTemporaryPassword, listUsers, countAdmins, updateUser, deleteUser, countUsers, findUserByEmail, findUserById, createUser, setPassword,
  recordLoginSuccess, recordLoginFailure,
  createSession, findSession, extendSession, deleteSession, deleteUserSessions, purgeExpired,
  createReset, findValidReset, consumeReset,
};
