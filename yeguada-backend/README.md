# 🌿 La Yeguada OBC — Chatbot Backend

Backend Express + `node-nlp` para el sistema de automatización conversacional del TFG.

## Instalación

```bash
cd yeguada-backend
npm install
npm start
```

El servidor levanta en **http://localhost:3001**

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/chat` | Clasificar mensaje y obtener respuesta |
| GET | `/api/metrics` | Métricas del dashboard |
| GET | `/api/intents` | Listar intenciones configuradas |
| GET | `/api/health` | Estado del servidor |
| GET/POST | `/api/whatsapp/*` | Control del bot de WhatsApp — ver [Bot de WhatsApp](#bot-de-whatsapp-pruebas) |

## Ejemplo de uso

```bash
# Clasificar mensaje
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "quiero reservar un tour", "sessionId": "user123"}'

# Respuesta
{
  "intent": "booking.tour",
  "score": 0.95,
  "answer": "Para reservar un tour en La Yeguada OBC...",
  "resolved": true,
  "escalated": false,
  "responseTimeMs": 12
}
```

## Intenciones configuradas

- `booking.tour` — Reserva de tours
- `pricing.info` — Precios y tarifas
- `guide.availability` — Disponibilidad de guías
- `general.info` — Información general
- `location.directions` — Cómo llegar
- `camping.info` — Camping
- `waterfall.info` — Cascadas
- `hours.info` — Horarios
- `greeting` — Saludos
- `farewell` — Despedidas

## Integración con el frontend React

En `src/services/chatbot.js`:

```js
export async function sendToNLP(message, sessionId) {
  const res = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });
  return res.json();
}

export async function getMetrics() {
  const res = await fetch('http://localhost:3001/api/metrics');
  return res.json();
}
```

## Bot de WhatsApp (pruebas)

El backend puede conectarse a un número de WhatsApp real usando
[`whatsapp-web.js`](https://wwebjs.dev/) (vincula tu WhatsApp Web, sin necesidad
de una cuenta de Meta Business).

### Conectar desde el dashboard (recomendado)

1. Arranca el backend normalmente (`npm start`) y el frontend.
2. En el dashboard, ve a **Configuración → Integración WhatsApp** y pulsa **Conectar**.
3. Aparecerá un código QR en la pantalla. Escanéalo desde tu teléfono:
   WhatsApp → Configuración → **Dispositivos vinculados** → **Vincular un dispositivo**.
4. El panel pasa a "Conectado" automáticamente en cuanto se vincula (consulta el estado cada 2s mientras espera).
5. Desde el mismo panel puedes **Desconectar** (desvincula el dispositivo, pedirá un nuevo QR la próxima vez)
   o **Reconectar** (reinicia el bot reutilizando la sesión actual, sin escanear de nuevo).

### Endpoints de control

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/whatsapp/status` | Estado actual: `disconnected` / `initializing` / `qr` / `authenticated` / `connected` / `disconnecting`, más el QR (data URL) y el número vinculado |
| POST | `/api/whatsapp/connect` | Inicia el cliente (pide QR si no hay sesión guardada) |
| POST | `/api/whatsapp/disconnect` | Cierra sesión y desvincula el dispositivo |
| POST | `/api/whatsapp/reconnect` | Reinicia el cliente reutilizando la sesión guardada |

### Auto-conexión al arrancar (opcional)

Para entornos sin acceso al dashboard, se puede seguir auto-conectando al levantar el servidor:

```bash
# Windows (PowerShell)
$env:ENABLE_WHATSAPP="true"; npm start

# macOS / Linux
ENABLE_WHATSAPP=true npm start
```

Esto llama a `connect()` automáticamente al boot; el QR resultante solo se puede ver desde
`GET /api/whatsapp/status` o el panel de Configuración del dashboard.

### Notas

- La sesión se guarda en `.wwebjs_auth/` (ignorado por git), así no hace falta
  escanear el QR cada vez que se reinicia el servidor.
- Las conversaciones de WhatsApp también alimentan `/api/metrics` y aparecen
  en el dashboard, identificadas con `channel: "whatsapp"`.
- Requiere Chromium (descargado automáticamente por Puppeteer al instalar dependencias).
- Esta integración es **no oficial** (usa WhatsApp Web), ideal para pruebas y demo del TFG.
  Para producción se recomienda migrar a la API oficial de WhatsApp Business (Meta Cloud API).

## Autenticación y correo

- Todo `/api/*` exige sesión, salvo `/api/auth/*`, `/api/health` y `/api/chat` (con límite de 60 req/min).
- Primer arranque, dos opciones:
  - **Desde el dashboard:** crea el administrador en la pantalla inicial (`POST /api/auth/setup`, solo funciona mientras no haya usuarios).
  - **En producción** (`NODE_ENV=production`) la pantalla de creación está cerrada y el servidor **no arranca** si no hay usuarios ni `ADMIN_*`. `ALLOW_SETUP=true` la reabre temporalmente (úsalo solo un momento y quítalo).
  - **Desde `.env`:** define `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME`; si la BD no tiene usuarios, se crea esa cuenta al arrancar. No hace nada si ya existen usuarios, así que puedes quitar esas líneas después. Nunca versiones el `.env`.
- Contraseñas con scrypt; sesiones opacas guardadas como hash en SQLite, cookie `httpOnly` + `SameSite=Lax` (7 días deslizantes).
- Bloqueo de 15 min tras 5 intentos fallidos, rate-limit por IP, respuestas genéricas (no revela qué correos existen).
- Recuperación: `POST /api/auth/forgot-password` envía un enlace de un solo uso (30 min) y al restablecer se cierran todas las sesiones.
- Correo con [Resend](https://resend.com): define `RESEND_API_KEY` y `MAIL_FROM` (remitente de un dominio verificado en Resend; el de pruebas `onboarding@resend.dev` solo entrega al dueño de la cuenta). Sin `RESEND_API_KEY`, los correos se imprimen en la consola del backend.
  Arranque con variables: `node --env-file=.env server.js`.

## Datos de prueba (solo desarrollo local)

```bash
npm run seed            # desde la raíz (o dentro de yeguada-backend/)
npm run seed -- --reset # borra las conversaciones y las regenera
```

Crea (o **restablece la contraseña** de) un administrador y un operador demo, más ~300 conversaciones de los
últimos 30 días (gráficos, escalamientos pendientes y atendidos). Si olvidas la contraseña en local, vuelve a
correr el seed. No se ejecuta con `NODE_ENV=production`.

Las credenciales se definen en `yeguada-backend/.env` (archivo ignorado por git; parte de `.env.example`):

```
SEED_ADMIN_EMAIL=demo@yeguada.local
SEED_ADMIN_PASSWORD=<tu contraseña>      # 10+ caracteres, letras y números
SEED_OPERATOR_EMAIL=operador@yeguada.local
SEED_OPERATOR_PASSWORD=<tu contraseña>
```

Si dejas una contraseña vacía, el seed genera una aleatoria y la muestra **una sola vez** al terminar.

## Usuarios y roles

El administrador gestiona usuarios en **Usuarios** (menú lateral) o con `/api/users`:

| Rol | Puede |
|-----|-------|
| `admin` | Todo: configuración, intenciones, base de conocimiento, WhatsApp y usuarios |
| `operador` | Ver panel, escalamientos y monitoreo; marcar escalamientos como atendidos; cambiar su contraseña |

- Al crear un usuario, el sistema **genera una contraseña temporal aleatoria y se la envía por correo al propio usuario** (el admin nunca la ve). La persona debe cambiarla en su primer ingreso: hasta entonces el backend solo le permite cambiar la contraseña o cerrar sesión. "Reenviar acceso" genera otra, invalida la anterior y cierra sus sesiones. Requiere Resend configurado; sin él, la contraseña se imprime en la consola del backend (solo desarrollo).
- Siempre debe quedar al menos un administrador; nadie puede eliminarse ni cambiarse el rol a sí mismo.
- Los permisos se validan en el backend (el frontend solo oculta opciones). Cambiar el rol de alguien cierra sus sesiones.
