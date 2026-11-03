// ─────────────────────────────────────────────────────────────
// Hash y verificación de contraseñas con scrypt (módulo crypto de Node,
// sin dependencias nativas extra). Formato: scrypt$N$r$p$salt$hash (base64).
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');

const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;

const scrypt = (password, salt, opts) =>
  new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, KEYLEN, opts, (err, key) => (err ? reject(err) : resolve(key))));

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, { N, r: R, p: P, maxmem: MAXMEM });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

async function verifyPassword(password, stored) {
  const [scheme, n, r, p, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(password, Buffer.from(salt, 'base64'), {
    N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM,
  });
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

// Hash de relleno: se verifica contra él cuando el email no existe, para que
// "usuario inexistente" y "contraseña incorrecta" tarden lo mismo.
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

// Política: 10+ caracteres, al menos una letra y un número, y no demasiado obvia.
function validatePassword(password, { email = '' } = {}) {
  if (typeof password !== 'string') return 'La contraseña es requerida';
  if (password.length < 10) return 'La contraseña debe tener al menos 10 caracteres';
  if (password.length > 128) return 'La contraseña es demasiado larga (máx. 128)';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Debe incluir letras y números';
  const local = email.split('@')[0].toLowerCase();
  if (local.length >= 4 && password.toLowerCase().includes(local)) return 'No debe contener tu correo';
  if (/^(.)\1+$/.test(password) || /password|contrase|12345678|qwerty/i.test(password)) return 'La contraseña es demasiado común';
  return null;
}

// Contraseña aleatoria (crypto.randomInt, sin sesgo) sin caracteres ambiguos (0/O, 1/l/I),
// con al menos una minúscula, una mayúscula, un dígito y un símbolo. Cumple validatePassword.
const SETS = ['abcdefghijkmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '-_.!@#'];
function generatePassword(length = 16) {
  const pick = (chars) => chars[crypto.randomInt(chars.length)];
  const all = SETS.join('');
  const out = SETS.map(pick);
  while (out.length < length) out.push(pick(all));
  for (let i = out.length - 1; i > 0; i--) { // Fisher–Yates
    const j = crypto.randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

module.exports = { generatePassword, hashPassword, verifyPassword, validatePassword, DUMMY_HASH, sha256, randomToken };
