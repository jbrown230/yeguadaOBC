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
