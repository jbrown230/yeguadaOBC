# 🌿 La Yeguada OBC — Dashboard React

Panel de administración para el sistema de automatización conversacional. TFG UNA — Sistemas de Información.

## Requisitos

- Node.js 18+
- Backend `yeguada-backend` corriendo en puerto 3001 (opcional — funciona en modo demo sin él)

## Instalación y arranque

```bash
cd yeguada-frontend
npm install
npm start
```

Abre: **http://localhost:3000**

## Estructura del proyecto

```
src/
├── components/
│   ├── Topbar.jsx          # Barra superior con estado del backend
│   ├── Sidebar.jsx         # Navegación lateral
│   ├── ChatPanel.jsx       # Panel de chatbot interactivo (lado derecho)
│   └── KpiCard.jsx         # Tarjeta de métricas reutilizable
├── pages/
│   ├── Dashboard.jsx       # Vista principal con KPIs y gráficas
│   ├── Intents.jsx         # Gestión de intenciones NLP
│   ├── KnowledgeBase.jsx   # CRUD de la base de conocimiento
│   ├── Monitor.jsx         # Monitoreo de conversaciones
│   └── Config.jsx          # Configuración del sistema
├── hooks/
│   └── useMetrics.js       # Polling de métricas cada 30s
├── services/
│   └── api.js              # Capa de comunicación con el backend + mock data
├── App.jsx                 # Componente raíz
├── index.js                # Entry point
└── index.css               # Variables globales y reset
```

## Páginas del dashboard

| Página | Descripción |
|--------|-------------|
| Panel de Control | KPIs, gráfica de volumen diario (chatbot vs humano), intenciones en donut chart, tabla de conversaciones recientes |
| Gestión de Intenciones | Lista de intenciones NLP configuradas con ejemplos, precisión y conteo de chats |
| Base de Conocimiento | CRUD de pares pregunta-respuesta con búsqueda y etiquetas |
| Monitoreo | Barras de rendimiento, conversaciones activas/completadas/en espera |
| Configuración | Parámetros del backend, umbral de confianza, integración WhatsApp, reglas de escalamiento |

## Modo demo vs. conectado

El dashboard funciona en dos modos:

**Sin backend (modo demo):** La app usa datos mock de `services/api.js`. El chatbot lateral usa un clasificador NLP local en JavaScript que replica las reglas del servidor.

**Con backend:** Arranque primero `yeguada-backend` (puerto 3001). El indicador en la barra superior cambia a "Backend conectado". Las métricas se actualizan cada 30 segundos desde el endpoint real.

## Variables de entorno

Cree `.env` en la raíz si necesita cambiar el proxy:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Dependencias principales

- `recharts` — gráficas de línea, barra y dona
- `react-router-dom` — navegación (preparado para rutas URL)
- `react-scripts` — CRA toolchain