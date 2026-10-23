# Reporte de evidencia E2E — WhatsApp

Rango solicitado (hora CR): **2026-10-23 00:00** a **2026-10-24 00:00**
Rango en UTC: `2026-10-23T06:00:00.000Z` a `2026-10-24T06:00:00.000Z`

## A. Mensajes (channel = whatsapp)

_No se encontraron mensajes de WhatsApp en este rango._

## B. Resumen

- Total de mensajes: **0**
- Resueltos por el bot: **0**
- Escalados a humano: **0**

_Sin datos de response_time_ms en este rango._

## C. RNF01 — Tiempos menores a 1000 ms

_Sin datos de response_time_ms en este rango._

> **Aclaración:** `response_time_ms` mide el tiempo de procesamiento del motor NLP (clasificación + búsqueda de respuesta), no la latencia de entrega del mensaje por WhatsApp (red, servidores de WhatsApp, etc.), que no se registra en esta base de datos.

## D. Nota sobre notificaciones al personal

Las notificaciones al personal (`notifyStaff()`) se envían por WhatsApp pero **no dejan registro en `data.db`**. Su verificación depende de la captura de pantalla del teléfono del personal que las recibe, no de este reporte.

## E. Trazabilidad

- Commit: `593e2e4ab9f0962d1125bc3a3c3601614bf6c73d`
- Fecha/hora de ejecución: 2026-10-23 16:02:43 (CR) / `2026-10-23T22:02:43.184Z` (UTC)
