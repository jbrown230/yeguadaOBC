// ─────────────────────────────────────────────────────────────
// Envío de correo con Resend (https://resend.com) — API HTTP, sin dependencias extra.
// Variables de entorno:
//   RESEND_API_KEY   clave de la API (re_…). Sin ella (desarrollo) el correo NO se envía:
//                    se imprime en consola con el enlace, para probar el flujo sin cuenta.
//   MAIL_FROM        remitente, p. ej. "Ecoturismo La Yeguada OBC <no-reply@tudominio.com>".
//                    El dominio debe estar verificado en Resend. Por defecto usa el remitente
//                    de pruebas onboarding@resend.dev, que SOLO entrega al correo dueño de la cuenta.
//   MAIL_REPLY_TO    (opcional) dirección a la que responden los usuarios.
// ─────────────────────────────────────────────────────────────
const templates = require('./templates');

const env = process.env;
const API_URL = 'https://api.resend.com/emails';
const FROM = env.MAIL_FROM || 'Ecoturismo La Yeguada OBC <onboarding@resend.dev>';
const REPLY_TO = env.MAIL_REPLY_TO || undefined;
const TIMEOUT_MS = 10_000;

const isConfigured = () => Boolean(env.RESEND_API_KEY);

async function send(to, { subject, html, text }) {
  if (!isConfigured()) {
    console.log(`\n📧 [mail:dev] RESEND_API_KEY no configurada — correo NO enviado\n   Para: ${to}\n   Asunto: ${subject}\n${text.split('\n').map((l) => '   ' + l).join('\n')}`);
    return { dev: true };
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text, reply_to: REPLY_TO }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Resend responde { statusCode, name, message }: se propaga el motivo real (dominio sin verificar, etc.)
    throw new Error(`Resend ${res.status}: ${data.message || data.name || 'error desconocido'}`);
  }
  return data; // { id }
}

module.exports = {
  isConfigured,
  sendPasswordReset: (user, ctx) => send(user.email, templates.passwordReset({ name: user.name, ...ctx })),
  sendPasswordChanged: (user, ctx) => send(user.email, templates.passwordChanged({ name: user.name, ...ctx })),
  sendCredentials: (user, ctx) => send(user.email, templates.credentials({ name: user.name, email: user.email, ...ctx })),
  sendWelcome: (user, ctx) => send(user.email, templates.welcome({ name: user.name, ...ctx })),
};
