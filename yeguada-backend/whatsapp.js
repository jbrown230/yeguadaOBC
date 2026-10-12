
// ─────────────────────────────────────────────────────────────
// Ecoturismo La Yeguada OBC — Conector WhatsApp
// Usa whatsapp-web.js. Controlable desde el dashboard vía
// connect()/disconnect()/reconnect()/getStatus() (ver server.js,
// rutas /api/whatsapp/*) — ya no se auto-inicia por consola.
// ─────────────────────────────────────────────────────────────
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { processMessage } = require('./nlp');
const db = require('./db');

const AUTH_PATH = './.wwebjs_auth';

let client = null;

// Estados: 'disconnected' | 'initializing' | 'qr' | 'authenticated' | 'connected' | 'disconnecting'
const state = {
  status: 'disconnected',
  qr: null,   // data URL PNG del código QR vigente
  info: null, // { pushname, number } una vez conectado
};

function buildClient() {
  const c = new Client({
    authStrategy: new LocalAuth({ dataPath: AUTH_PATH }),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });

  c.on('qr', async (qr) => {
    try {
      state.qr = await QRCode.toDataURL(qr);
      state.status = 'qr';
    } catch (err) {
      console.error('Error generando QR de WhatsApp:', err);
    }
  });

  c.on('authenticated', () => {
    state.status = 'authenticated';
    state.qr = null;
  });

  c.on('ready', () => {
    state.status = 'connected';
    state.qr = null;
    state.info = {
      pushname: c.info?.pushname || null,
      number: c.info?.wid?.user || null,
    };
    console.log('✅ Bot de WhatsApp conectado y listo para recibir mensajes.');
  });

  c.on('auth_failure', (msg) => {
    console.error('❌ Fallo de autenticación WhatsApp:', msg);
    state.status = 'disconnected';
    state.qr = null;
    state.info = null;
    client = null;
  });

  c.on('disconnected', (reason) => {
    console.log('⚠️ Bot de WhatsApp desconectado:', reason);
    state.status = 'disconnected';
    state.qr = null;
    state.info = null;
    client = null;
  });

  c.on('message', async (msg) => {
    // Ignorar mensajes propios y de grupos (solo chats individuales)
    if (msg.fromMe || msg.from.endsWith('@g.us')) return;

    const text = (msg.body || '').trim();
    if (!text) return;

    try {
      const result = await processMessage(text, msg.from, 'whatsapp');
      await msg.reply(result.answer);
      if (!result.resolved) notifyStaff({ message: text, channel: 'whatsapp', sessionId: msg.from }).catch(() => {});
    } catch (err) {
      console.error('Error procesando mensaje de WhatsApp:', err);
      await msg.reply('Lo siento, ocurrió un error procesando tu mensaje. Intenta nuevamente.');
    }
  });

  return c;
}

// Avisa al staff por WhatsApp cuando el bot escala una conversación (de
// cualquier canal, no solo WhatsApp). "Mejor esfuerzo": si no hay número
// configurado o el bot no está conectado, no hace nada — nunca bloquea
// ni rompe el flujo del chat que la originó.
async function notifyStaff({ message, channel, sessionId }) {
  if (!client || state.status !== 'connected') return;
  const number = db.getStaffWhatsappNumber();
  if (!number) return;

  const origen = channel === 'whatsapp' ? `WhatsApp (${sessionId})` : channel;
  const text = `🔔 Escalamiento pendiente — ${origen}:\n"${message}"\n\nRevisa el dashboard para más detalle.`;
  try {
    await client.sendMessage(`${number}@c.us`, text);
  } catch (err) {
    console.error('Error reenviando aviso de escalamiento al staff:', err.message);
  }
}

// Inicia el cliente. Si ya existe sesión guardada en AUTH_PATH, se
// reconecta sin pedir QR; si no, dispara el evento 'qr'.
// No espera a que termine de conectar — el estado se consulta vía getStatus().
function connect() {
  if (client) return getStatus();

  state.status = 'initializing';
  state.qr = null;
  client = buildClient();

  client.initialize().catch((err) => {
    console.error('Error al inicializar WhatsApp:', err);
    state.status = 'disconnected';
    state.qr = null;
    client = null;
  });

  return getStatus();
}

// Cierra sesión por completo (desvincula el dispositivo). La próxima
// conexión requerirá escanear un nuevo QR.
async function disconnect() {
  if (!client) {
    state.status = 'disconnected';
    return getStatus();
  }

  state.status = 'disconnecting';
  try {
    await client.logout();
  } catch (err) {
    console.error('Error en logout de WhatsApp, forzando cierre:', err.message);
    try { await client.destroy(); } catch {}
  }

  client = null;
  state.status = 'disconnected';
  state.qr = null;
  state.info = null;
  return getStatus();
}

// Reinicia el cliente reutilizando la sesión guardada (sin desvincular).
// Útil si el bot quedó colgado o perdió la conexión con WhatsApp.
async function reconnect() {
  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
  }
  return connect();
}

function getStatus() {
  return { status: state.status, qr: state.qr, info: state.info };
}

module.exports = { connect, disconnect, reconnect, getStatus, notifyStaff };
