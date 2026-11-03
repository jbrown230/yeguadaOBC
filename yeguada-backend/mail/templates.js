// ─────────────────────────────────────────────────────────────
// Plantillas de correo — minimalistas, con la identidad del panel (verde-negro + oro).
// HTML basado en tablas con estilos en línea (compatible con Gmail/Outlook/Apple Mail), sin
// imágenes externas: el logotipo es texto, así nunca se rompe por bloqueo de imágenes.
// Soporta modo oscuro (prefers-color-scheme) en los clientes que lo admiten. Incluye texto plano.
// ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F5F7', card: '#FFFFFF', line: '#EBEBF0', ink: '#1D1D1F', text: '#6E6E73', faint: '#8E8E93',
  forest: '#111A13', gold: '#FFA700', goldInk: '#2C3B28', soft: '#F5F5F7',
};
const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,monospace";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Modo oscuro: las clases se sobrescriben con !important donde el cliente soporta la media query.
const DARK_CSS = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .bg { background: #0A0A0C !important; }
    .card { background: #111215 !important; border-color: rgba(255,255,255,0.08) !important; }
    .h { color: #F4F4F5 !important; }
    .t { color: #A1A1AA !important; }
    .f { color: #71717A !important; }
    .rule { border-color: rgba(255,255,255,0.08) !important; }
    .box { background: #1C1C20 !important; }
    .btn { background: #F4F4F5 !important; }
    .btn a { color: #0A0A0C !important; }
    .lnk { color: #9FD58F !important; }
  }`;

function button(href, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0"><tr>
    <td class="btn" style="border-radius:999px;background:${C.forest}">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font:600 15px ${FONT};color:#FFFFFF;text-decoration:none;border-radius:999px;letter-spacing:-0.01em">${esc(label)}</a>
    </td>
  </tr></table>`;
}

function layout({ preheader, title, bodyHtml }) {
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title><style>${DARK_CSS}</style></head>
<body class="bg" style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg" style="background:${C.bg}"><tr><td align="center" style="padding:40px 16px 32px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
    <tr><td class="card" style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:40px 36px 36px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px"><tr>
        <td width="32" height="32" align="center" style="width:32px;height:32px;border-radius:10px;background:${C.gold};font:700 12px ${FONT};color:${C.goldInk}">LY</td>
        <td class="h" style="padding-left:10px;font:600 14px ${FONT};color:${C.ink};letter-spacing:-0.01em">La Yeguada OBC</td>
      </tr></table>
      ${bodyHtml}
    </td></tr>
    <tr><td class="f" align="center" style="padding:24px 12px 0;font:400 12px/1.6 ${FONT};color:${C.faint}">
      Ecoturismo La Yeguada OBC<br>Reserva Forestal La Yeguada · Calobre, Veraguas, Panamá
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const h1 = (t) => `<h1 class="h" style="margin:0 0 12px;font:700 26px/1.2 ${FONT};letter-spacing:-0.035em;color:${C.ink}">${t}</h1>`;
const p = (t) => `<p class="t" style="margin:0 0 14px;font:400 15px/1.65 ${FONT};color:${C.text}">${t}</p>`;
const small = (t) => `<p class="f rule" style="margin:30px 0 0;padding-top:20px;border-top:1px solid ${C.line};font:400 13px/1.6 ${FONT};color:${C.faint}">${t}</p>`;
const link = (url) => `<p class="f" style="margin:18px 0 0;font:400 12px/1.6 ${FONT};color:${C.faint}">¿El botón no funciona? Copia este enlace:<br><a class="lnk" href="${esc(url)}" style="color:#396B2C;word-break:break-all">${esc(url)}</a></p>`;
const field = (label, value) => `
  <div class="f" style="font:500 12px ${FONT};color:${C.faint};margin:0 0 4px">${esc(label)}</div>
  <div class="h" style="font:600 16px ${MONO};letter-spacing:0.02em;color:${C.ink};word-break:break-all">${esc(value)}</div>`;
const firstName = (name) => esc(String(name).split(' ')[0]);

function passwordReset({ name, url, minutes }) {
  return {
    subject: 'Restablece tu contraseña',
    html: layout({
      preheader: `Tu enlace vence en ${minutes} minutos.`,
      title: 'Restablece tu contraseña',
      bodyHtml: h1('Restablece tu contraseña') +
        p(`Hola ${firstName(name)}, recibimos una solicitud para cambiar la contraseña de tu cuenta del panel.`) +
        button(url, 'Crear nueva contraseña') +
        small(`El enlace vence en <strong>${minutes} minutos</strong> y solo se puede usar una vez. Si no fuiste tú, ignora este correo: tu contraseña no cambiará.`) +
        link(url),
    }),
    text: `Hola ${name},\n\nRecibimos una solicitud para restablecer tu contraseña del panel de La Yeguada OBC.\n\nCrea una nueva aquí (vence en ${minutes} min, un solo uso):\n${url}\n\nSi no fuiste tú, ignora este mensaje.\n`,
  };
}

function passwordChanged({ name, when, loginUrl }) {
  return {
    subject: 'Tu contraseña fue actualizada',
    html: layout({
      preheader: 'Se cambió la contraseña de tu cuenta.',
      title: 'Contraseña actualizada',
      bodyHtml: h1('Contraseña actualizada') +
        p(`Hola ${firstName(name)}, te confirmamos que la contraseña de tu cuenta se cambió el <strong>${esc(when)}</strong>. Por seguridad cerramos tus otras sesiones abiertas.`) +
        button(loginUrl, 'Iniciar sesión') +
        small('¿No reconoces este cambio? Restablece tu contraseña de inmediato desde “¿Olvidaste tu contraseña?” y avisa a un administrador.'),
    }),
    text: `Hola ${name},\n\nTu contraseña se cambió el ${when}. Cerramos tus otras sesiones.\nSi no fuiste tú, restablécela de inmediato: ${loginUrl}\n`,
  };
}

function credentials({ name, email, password, loginUrl, inviterName, reason }) {
  const reset = reason === 'reset';
  const intro = reset
    ? `${esc(inviterName)} generó una nueva contraseña temporal para tu cuenta del panel.`
    : `${esc(inviterName)} te dio acceso al panel de administración del chatbot de La Yeguada OBC.`;
  const box = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="box" style="margin:24px 0 0;background:${C.soft};border-radius:14px"><tr><td style="padding:20px 22px">
      ${field('Correo', email)}
      <div style="height:16px"></div>
      ${field('Contraseña temporal', password)}
    </td></tr></table>`;
  return {
    subject: reset ? 'Tu nueva contraseña temporal' : 'Tu acceso a La Yeguada OBC',
    html: layout({
      preheader: 'Tu contraseña temporal para entrar al panel.',
      title: 'Tu acceso',
      bodyHtml: h1(reset ? 'Nueva contraseña temporal' : `Te damos la bienvenida, ${firstName(name)}`) +
        p(intro) + box + button(loginUrl, 'Iniciar sesión') +
        small('Te pediremos <strong>crear tu propia contraseña</strong> en tu primer ingreso. No la compartas ni reenvíes este correo. Si no lo esperabas, ignóralo.'),
    }),
    text: `Hola ${name},\n\n${reset ? inviterName + ' generó una nueva contraseña temporal para tu cuenta' : inviterName + ' te dio acceso al panel de La Yeguada OBC'}.\n\nCorreo: ${email}\nContraseña temporal: ${password}\n\nInicia sesión: ${loginUrl}\nTe pediremos crear tu propia contraseña en tu primer ingreso. No la compartas.\n`,
  };
}

function welcome({ name, loginUrl }) {
  return {
    subject: 'Bienvenido a La Yeguada OBC',
    html: layout({
      preheader: 'Tu cuenta de administrador está lista.',
      title: 'Bienvenido',
      bodyHtml: h1(`Te damos la bienvenida, ${firstName(name)}`) +
        p('Tu cuenta de administrador está lista. Desde el panel gestionas intenciones, la base de conocimiento, los escalamientos y la integración con WhatsApp.') +
        button(loginUrl, 'Abrir el panel'),
    }),
    text: `Hola ${name},\n\nTu cuenta de administrador está lista: ${loginUrl}\n`,
  };
}

module.exports = { credentials, passwordReset, passwordChanged, welcome };
