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
