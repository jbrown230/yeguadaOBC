# Ecoturismo La Yeguada OBC — Sistema de Automatización Conversacional

TFG — Universidad Nacional de Costa Rica (UNA), Licenciatura en Sistemas de Información.

Sistema de chatbot con NLP para el manejo de consultas ecoturísticas, compuesto por un backend Express y un dashboard administrativo en React.

---

## Estructura del repositorio

```
ecoturismo-la-yeguada/
├── yeguada-backend/     # API REST + motor NLP (Express + node-nlp)
└── yeguada-frontend/    # Dashboard administrativo (React + Recharts)
```

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Instalación y arranque

### Backend (puerto 3001)

```bash
cd yeguada-backend
npm install
npm start
```

### Frontend (puerto 3000)

```bash
cd yeguada-frontend
npm install
npm start
```

Abre el dashboard en: **http://localhost:3000**

> El frontend funciona en **modo demo** sin el backend activo. Para datos reales, arranca primero el backend.

---

## Funcionalidades

- Chatbot con clasificación de intenciones en lenguaje natural (NLP)
- Dashboard con KPIs, gráficas de volumen y monitoreo de conversaciones
- Gestión de intenciones y base de conocimiento
- Modo demo (sin backend) y modo conectado
- Indicador de estado de conexión en tiempo real

## Intenciones NLP configuradas

| Intención | Descripción |
|---|---|
| `booking.tour` | Reserva de tours |
| `pricing.info` | Precios y tarifas |
| `guide.availability` | Disponibilidad de guías |
| `general.info` | Información general |
| `location.directions` | Cómo llegar |
| `camping.info` | Camping |
| `waterfall.info` | Cascadas |
| `hours.info` | Horarios |
| `greeting` | Saludos |
| `farewell` | Despedidas |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, node-nlp |
| Frontend | React 18, Recharts, React Router v6 |
| Comunicación | REST API (fetch) |
