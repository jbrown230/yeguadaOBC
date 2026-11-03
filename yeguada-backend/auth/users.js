// ─────────────────────────────────────────────────────────────
// /api/users — gestión de usuarios (solo admin; el guard se aplica en server.js)
//
// El admin NUNCA ve ni escribe contraseñas: el servidor genera una temporal aleatoria y se la
// envía por correo al propio usuario, que debe cambiarla en su primer ingreso (must_change_password).
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cfg = require('./config');
const store = require('./store');
const mail = require('../mail');
const { hashPassword, generatePassword } = require('./passwords');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanName = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 80);

// Genera una contraseña temporal, la guarda (hash) y la envía por correo. Lanza si el correo falla.
async function issueTemporaryPassword(user, inviter, reason) {
  const password = generatePassword();
  store.setTemporaryPassword(user.id, await hashPassword(password));
  store.deleteUserSessions(user.id);
  await mail.sendCredentials(user, { password, loginUrl: `${cfg.APP_URL}/login`, inviterName: inviter.name, reason });
}

router.get('/', (_req, res) => res.json(store.listUsers()));

router.post('/', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = cleanName(req.body.name);
  const { role } = req.body;
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Correo no válido' });
  if (name.length < 2) return res.status(400).json({ error: 'Ingresa el nombre' });
  if (!cfg.ROLES.includes(role)) return res.status(400).json({ error: 'Rol no válido' });
  if (store.findUserByEmail(email)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });

  // Se crea con una contraseña aleatoria desconocida; issueTemporaryPassword la reemplaza por la que se envía.
  const user = store.createUser({ email, name, role, passwordHash: await hashPassword(generatePassword(32)), mustChangePassword: true });

  let emailed = true;
  let mailError = null;
  try { await issueTemporaryPassword(user, req.user, 'new'); }
  catch (e) { emailed = false; mailError = e.message; console.error('mail credentials:', e.message); }

  res.status(201).json({ user: store.publicUserFull(user), emailed, mailError, mailConfigured: mail.isConfigured() });
});

router.put('/:id', (req, res) => {
  const target = store.findUserById(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  const name = cleanName(req.body.name ?? target.name);
  const role = req.body.role ?? target.role;
  if (name.length < 2) return res.status(400).json({ error: 'Ingresa el nombre' });
  if (!cfg.ROLES.includes(role)) return res.status(400).json({ error: 'Rol no válido' });
  if (target.id === req.user.id && role !== target.role) return res.status(409).json({ error: 'No puedes cambiar tu propio rol' });
  if (target.role === 'admin' && role !== 'admin' && store.countAdmins() <= 1) {
    return res.status(409).json({ error: 'Debe quedar al menos un administrador' });
  }
  store.updateUser(target.id, { name, role });
  if (target.role !== role) store.deleteUserSessions(target.id); // fuerza a releer permisos
  res.json(store.publicUserFull(store.findUserById(target.id)));
});

router.delete('/:id', (req, res) => {
  const target = store.findUserById(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (target.id === req.user.id) return res.status(409).json({ error: 'No puedes eliminar tu propia cuenta' });
  if (target.role === 'admin' && store.countAdmins() <= 1) {
    return res.status(409).json({ error: 'Debe quedar al menos un administrador' });
  }
  store.deleteUser(target.id);
  res.json({ ok: true });
});

// Reenviar acceso: nueva contraseña temporal por correo (la anterior deja de funcionar y se cierran sus sesiones)
router.post('/:id/send-reset', async (req, res) => {
  const target = store.findUserById(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (target.id === req.user.id) return res.status(409).json({ error: 'Para cambiar tu contraseña usa Mi cuenta' });
  try { await issueTemporaryPassword(target, req.user, 'reset'); }
  catch (e) { return res.status(502).json({ error: `No se pudo enviar el correo: ${e.message}` }); }
  res.json({ ok: true, mailConfigured: mail.isConfigured() });
});

module.exports = router;
