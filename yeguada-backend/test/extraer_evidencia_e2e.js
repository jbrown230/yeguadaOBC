// yeguada-backend/test/extraer_evidencia_e2e.js
//
// Script de SOLO LECTURA: extrae evidencia de pruebas E2E de WhatsApp desde
// data.db (tabla conversations, channel = 'whatsapp') para un rango de
// fecha-hora dado en hora de Costa Rica (UTC-6, sin horario de verano).
//
// No modifica data.db (se abre con readonly: true), no toca .wwebjs_auth,
// no envía mensajes, no importa nlp.js ni whatsapp.js.
//
// Uso:
//   node extraer_evidencia_e2e.js "2026-10-18 09:00" "2026-10-18 11:30" [nombreBase]
//
// Genera (en este mismo directorio), con nombreBase por defecto "reporte_e2e":
//   <nombreBase>.json
//   <nombreBase>.md

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const Database = require('better-sqlite3');

const CR_OFFSET_HOURS = 6; // Costa Rica = UTC-6, todo el año (sin DST)

function parseLocalCR(input, label) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec((input || '').trim());
  if (!m) {
    throw new Error(
      `${label} inválido: "${input}". Formato esperado: "YYYY-MM-DD HH:mm" u "YYYY-MM-DD HH:mm:ss" en hora de Costa Rica.`
    );
  }
  const [, y, mo, d, h, mi, s] = m;
  // Hora local CR + 6h = UTC
  const utcMs = Date.UTC(
    Number(y), Number(mo) - 1, Number(d),
    Number(h) + CR_OFFSET_HOURS, Number(mi), Number(s || 0)
  );
  return new Date(utcMs);
}

function utcIsoToLocalCR(isoUtc) {
  if (!isoUtc) return null;
  const d = new Date(isoUtc);
  const local = new Date(d.getTime() - CR_OFFSET_HOURS * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ` +
         `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())} (CR)`;
}

function percentile95(sortedAsc) {
  if (sortedAsc.length === 0) return null;
  const idx = Math.ceil(0.95 * sortedAsc.length) - 1;
  return sortedAsc[Math.min(idx, sortedAsc.length - 1)];
}

function mdEscape(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function normalize(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Carga intent_examples (solo lectura) para resolver, por frase, si el texto
// de un mensaje coincide exactamente (ignorando mayúsculas/tildes) con alguna
// frase de entrenamiento y de qué intención es.
function loadTrainingPhraseMap(db) {
  const rows = db.prepare('SELECT intent_id, phrase FROM intent_examples').all();
  const map = new Map();
  for (const r of rows) {
    const key = normalize(r.phrase);
    if (!map.has(key)) map.set(key, r.intent_id);
  }
  return map;
}

function main() {
  const [, , startArg, endArg, outBaseArg] = process.argv;
  if (!startArg || !endArg) {
    console.error('Uso: node extraer_evidencia_e2e.js "<inicio CR>" "<fin CR>"');
    console.error('Ejemplo: node extraer_evidencia_e2e.js "2026-10-18 09:00" "2026-10-18 11:30"');
    process.exit(1);
  }

  let startUtc, endUtc;
  try {
    startUtc = parseLocalCR(startArg, 'Inicio');
    endUtc = parseLocalCR(endArg, 'Fin');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (endUtc <= startUtc) {
    console.error('El fin debe ser posterior al inicio.');
    process.exit(1);
  }

  const outBase = outBaseArg || 'reporte_e2e';

  const dbPath = path.join(__dirname, '..', 'data.db');
  if (!fs.existsSync(dbPath)) {
    console.error(`No se encontró data.db en: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true, fileMustExist: true });

  // Confirmar que la tabla/columnas esperadas existen antes de inventar nada.
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'").get();
  if (!tableInfo) {
    console.error("La tabla 'conversations' no existe en data.db.");
    db.close();
    process.exit(1);
  }
  const cols = db.prepare("PRAGMA table_info(conversations)").all().map((c) => c.name);
  const required = ['id', 'session_id', 'channel', 'message', 'intent', 'score', 'resolved', 'answer', 'response_time_ms', 'created_at', 'handled'];
  const missing = required.filter((c) => !cols.includes(c));
  if (missing.length > 0) {
    console.error(`Faltan columnas esperadas en conversations: ${missing.join(', ')}`);
    db.close();
    process.exit(1);
  }

  const examplesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='intent_examples'").get();
  if (!examplesTable) {
    console.error("La tabla 'intent_examples' no existe en data.db — no se puede calcular 'en_entrenamiento'.");
    db.close();
    process.exit(1);
  }

  const rows = db.prepare(`
    SELECT id, session_id, channel, message, intent, score, resolved, answer, response_time_ms, created_at, handled, handled_at
    FROM conversations
    WHERE channel = 'whatsapp' AND created_at >= ? AND created_at < ?
    ORDER BY created_at ASC
  `).all(startUtc.toISOString(), endUtc.toISOString());

  const trainingPhraseMap = loadTrainingPhraseMap(db);

  db.close();

  const total = rows.length;
  const resolvedCount = rows.filter((r) => r.resolved === 1).length;
  const escalatedCount = total - resolvedCount;

  const responseTimes = rows
    .map((r) => r.response_time_ms)
    .filter((v) => v !== null && v !== undefined)
    .sort((a, b) => a - b);

  const rtStats = responseTimes.length > 0 ? {
    count: responseTimes.length,
    minMs: responseTimes[0],
    avgMs: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
    maxMs: responseTimes[responseTimes.length - 1],
    p95Ms: percentile95(responseTimes),
  } : null;

  const under1000 = responseTimes.filter((v) => v < 1000).length;
  const under1000Pct = responseTimes.length > 0 ? Math.round((under1000 / responseTimes.length) * 100) : null;

  let gitCommit = null;
  let gitError = null;
  try {
    gitCommit = execSync('git rev-parse HEAD', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }).trim();
  } catch (err) {
    gitError = err.message;
  }

  const generatedAt = new Date().toISOString();
  const generatedAtLocal = utcIsoToLocalCR(generatedAt);

  const tableRows = rows.map((r) => {
    const matchedIntent = trainingPhraseMap.get(normalize(r.message));
    return {
      id: r.id,
      created_at_local: utcIsoToLocalCR(r.created_at),
      created_at_utc: r.created_at,
      session_id: r.session_id,
      message: r.message,
      intent: r.intent,
      score: typeof r.score === 'number' ? Number(r.score.toFixed(2)) : null,
      resolved: r.resolved === 1,
      answer: r.answer,
      response_time_ms: r.response_time_ms,
      handled: r.handled === 1,
      enEntrenamiento: matchedIntent ? { coincide: true, intentId: matchedIntent } : { coincide: false, intentId: null },
    };
  });

  const report = {
    generatedAtUtc: generatedAt,
    generatedAtLocalCR: generatedAtLocal,
    gitCommit,
    gitError,
    channel: 'whatsapp',
    rangeRequested: {
      startLocalCR: startArg,
      endLocalCR: endArg,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
    },
    totalMessages: total,
    resolvedCount,
    escalatedCount,
    responseTimeStats: rtStats,
    under1000msCount: responseTimes.length > 0 ? under1000 : null,
    under1000msPct: under1000Pct,
    rows: tableRows,
  };

  const jsonPath = path.join(__dirname, `${outBase}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // ── Markdown ──
  const lines = [];
  lines.push('# Reporte de evidencia E2E — WhatsApp');
  lines.push('');
  lines.push(`Rango solicitado (hora CR): **${startArg}** a **${endArg}**`);
  lines.push(`Rango en UTC: \`${startUtc.toISOString()}\` a \`${endUtc.toISOString()}\``);
  lines.push('');

  lines.push('## A. Mensajes (channel = whatsapp)');
  lines.push('');
  if (total === 0) {
    lines.push('_No se encontraron mensajes de WhatsApp en este rango._');
  } else {
    lines.push('| id | created_at (CR) | session_id | message | intent | score | resolved | answer | response_time_ms | handled | en_entrenamiento |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of tableRows) {
      const enEntrenamiento = r.enEntrenamiento.coincide ? `sí (${mdEscape(r.enEntrenamiento.intentId)})` : 'no';
      lines.push(
        `| ${r.id} | ${r.created_at_local} | ${mdEscape(r.session_id)} | ${mdEscape(r.message)} | ${mdEscape(r.intent)} | ` +
        `${r.score === null ? '' : r.score.toFixed(2)} | ${r.resolved ? 'sí' : 'no'} | ${mdEscape(r.answer)} | ` +
        `${r.response_time_ms === null || r.response_time_ms === undefined ? '' : r.response_time_ms} | ${r.handled ? 'sí' : 'no'} | ${enEntrenamiento} |`
      );
    }
  }
  lines.push('');

  lines.push('## B. Resumen');
  lines.push('');
  lines.push(`- Total de mensajes: **${total}**`);
  lines.push(`- Resueltos por el bot: **${resolvedCount}**`);
  lines.push(`- Escalados a humano: **${escalatedCount}**`);
  lines.push('');
  if (rtStats) {
    lines.push('Estadísticas de `response_time_ms`:');
    lines.push('');
    lines.push(`- Mínimo: ${rtStats.minMs} ms`);
    lines.push(`- Promedio: ${rtStats.avgMs} ms`);
    lines.push(`- Máximo: ${rtStats.maxMs} ms`);
    lines.push(`- Percentil 95: ${rtStats.p95Ms} ms`);
  } else {
    lines.push('_Sin datos de response_time_ms en este rango._');
  }
  lines.push('');

  lines.push('## C. RNF01 — Tiempos menores a 1000 ms');
  lines.push('');
  if (responseTimes.length > 0) {
    lines.push(`- ${under1000} de ${responseTimes.length} mensajes (${under1000Pct}%) tuvieron response_time_ms < 1000 ms.`);
  } else {
    lines.push('_Sin datos de response_time_ms en este rango._');
  }
  lines.push('');
  lines.push('> **Aclaración:** `response_time_ms` mide el tiempo de procesamiento del motor NLP ' +
    '(clasificación + búsqueda de respuesta), no la latencia de entrega del mensaje por WhatsApp ' +
    '(red, servidores de WhatsApp, etc.), que no se registra en esta base de datos.');
  lines.push('');

  lines.push('## D. Nota sobre notificaciones al personal');
  lines.push('');
  lines.push('Las notificaciones al personal (`notifyStaff()`) se envían por WhatsApp pero **no dejan registro ' +
    'en `data.db`**. Su verificación depende de la captura de pantalla del teléfono del personal que las recibe, ' +
    'no de este reporte.');
  lines.push('');

  lines.push('## E. Trazabilidad');
  lines.push('');
  lines.push(`- Commit: \`${gitCommit || 'no disponible' + (gitError ? ` (${gitError})` : '')}\``);
  lines.push(`- Fecha/hora de ejecución: ${generatedAtLocal} / \`${generatedAt}\` (UTC)`);
  lines.push('');

  const mdPath = path.join(__dirname, `${outBase}.md`);
  fs.writeFileSync(mdPath, lines.join('\n'));

  console.log(`OK. ${total} mensaje(s) de WhatsApp encontrados en el rango.`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`MD:   ${mdPath}`);
}

main();
