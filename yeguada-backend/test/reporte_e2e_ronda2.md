# Reporte de evidencia E2E — WhatsApp

Rango solicitado (hora CR): **2026-10-19 00:00** a **2026-10-20 00:00**
Rango en UTC: `2026-10-19T06:00:00.000Z` a `2026-10-20T06:00:00.000Z`

## A. Mensajes (channel = whatsapp)

| id | created_at (CR) | session_id | message | intent | score | resolved | answer | response_time_ms | handled | en_entrenamiento |
|---|---|---|---|---|---|---|---|---|---|---|
| 96 | 2026-10-19 19:41:06 (CR) | 244508394582183@lid | Hola | greeting | 1.00 | sí | ¡Hola! 👋 Bienvenido al asistente virtual de Ecoturismo La Yeguada OBC. Estoy aquí para ayudarte con información sobre nuestros tours, precios, cómo llegar y más. ¿En qué puedo asistirte hoy? | 11 | no | sí (greeting) |
| 97 | 2026-10-19 19:41:12 (CR) | 244508394582183@lid | ¿Cuánto cuesta el tour a las cascadas? | pricing.info | 1.00 | sí | 💰 Nuestros precios son: 🥾 Tour Senderismo Básico: $25/persona 🌊 Tour Cascadas Celestes: $35/persona 🌿 Tour Completo (cascadas + almuerzo típico): $45/persona  Grupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico? | 34 | no | no |
| 98 | 2026-10-19 19:41:17 (CR) | 244508394582183@lid | Quiero reservar un tour para 4 personas | booking.tour | 1.00 | sí | Para reservar un tour en La Yeguada OBC, contáctenos por WhatsApp al +507 6XXX-XXXX o escríbanos al correo info@ecoturismolayeguada.com. Ofrecemos tours guiados de senderismo, cascadas y agroturismo. Se recomienda reservar con 48h de anticipación. ¿Le gustaría saber más sobre algún tour en específico? | 108 | no | no |
| 99 | 2026-10-19 19:41:28 (CR) | 244508394582183@lid | ¿Cómo llego a La Yeguada? | location.directions | 1.00 | sí | Desde Ciudad de Panamá: Carretera Interamericana → desvío en El Jagüito → Calobre → La Yeguada (~260 km, 4-5 horas). Se recomienda 4x4. | 19 | no | no |
| 100 | 2026-10-19 19:41:34 (CR) | 244508394582183@lid | ¿A qué hora abren? | hours.info | 1.00 | sí | ⏰ Horarios: 📅 Atención: lun-dom (vía WhatsApp en horario de oficina) 🌅 Tours: salen a las 7:00-8:00 AM 🏞️ Acceso reserva: 7:30 AM - 4:30 PM  Se recomienda llegar temprano para aprovechar el día completo. | 18 | no | no |
| 101 | 2026-10-19 19:41:41 (CR) | 244508394582183@lid | ¿Hay guías disponibles el sábado? | guide.availability | 1.00 | sí | 🧭 Contamos con guías comunitarios certificados. La disponibilidad varía según la temporada: 🌅 Temporada alta (dic-abr): reserve con 1 semana de anticipación 🌧️ Temporada baja (may-nov): mayor disponibilidad  Todos nuestros guías son locales y conocen la flora, fauna y tradiciones del lugar. ¿Para qué fecha necesita el servicio? | 39 | no | no |
| 102 | 2026-10-19 19:41:47 (CR) | 244508394582183@lid | Quiero poner una queja por un cobro con tarjeta | fuera.de.alcance | 0.79 | no | 🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX. | 41 | no | no |
| 103 | 2026-10-19 19:41:51 (CR) | 244508394582183@lid | asdfgh | None | 1.00 | no | 🔄 Esta consulta requiere atención personalizada. Te conectaré con un operador humano en breve. También puedes escribirnos directamente al WhatsApp +507 6XXX-XXXX. | 20 | no | no |
| 104 | 2026-10-19 19:42:31 (CR) | 244508394582183@lid | ¿Cuál es la tarifa para visitar las cascadas? | pricing.info | 0.86 | sí | 💰 Nuestros precios son: 🥾 Tour Senderismo Básico: $25/persona 🌊 Tour Cascadas Celestes: $35/persona 🌿 Tour Completo (cascadas + almuerzo típico): $45/persona  Grupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico? | 39 | no | no |
| 105 | 2026-10-19 19:42:38 (CR) | 244508394582183@lid | ¿Cuánto me sale el recorrido a la cascada con guía? | guide.availability | 0.77 | sí | 🧭 Contamos con guías comunitarios certificados. La disponibilidad varía según la temporada: 🌅 Temporada alta (dic-abr): reserve con 1 semana de anticipación 🌧️ Temporada baja (may-nov): mayor disponibilidad  Todos nuestros guías son locales y conocen la flora, fauna y tradiciones del lugar. ¿Para qué fecha necesita el servicio? | 38 | no | no |
| 106 | 2026-10-19 19:42:47 (CR) | 244508394582183@lid | ¿Qué precio tiene la entrada a las cascadas? | pricing.info | 0.93 | sí | 💰 Nuestros precios son: 🥾 Tour Senderismo Básico: $25/persona 🌊 Tour Cascadas Celestes: $35/persona 🌿 Tour Completo (cascadas + almuerzo típico): $45/persona  Grupos de 8+ personas tienen descuento especial del 15%. Niños menores de 6 años gratuitos. ¿Desea información de algún tour específico? | 33 | no | no |

## B. Resumen

- Total de mensajes: **11**
- Resueltos por el bot: **9**
- Escalados a humano: **2**

Estadísticas de `response_time_ms`:

- Mínimo: 11 ms
- Promedio: 36 ms
- Máximo: 108 ms
- Percentil 95: 108 ms

## C. RNF01 — Tiempos menores a 1000 ms

- 11 de 11 mensajes (100%) tuvieron response_time_ms < 1000 ms.

> **Aclaración:** `response_time_ms` mide el tiempo de procesamiento del motor NLP (clasificación + búsqueda de respuesta), no la latencia de entrega del mensaje por WhatsApp (red, servidores de WhatsApp, etc.), que no se registra en esta base de datos.

## D. Nota sobre notificaciones al personal

Las notificaciones al personal (`notifyStaff()`) se envían por WhatsApp pero **no dejan registro en `data.db`**. Su verificación depende de la captura de pantalla del teléfono del personal que las recibe, no de este reporte.

## E. Trazabilidad

- Commit: `593e2e4ab9f0962d1125bc3a3c3601614bf6c73d`
- Fecha/hora de ejecución: 2026-10-19 19:50:44 (CR) / `2026-10-20T01:50:44.816Z` (UTC)
