// ─────────────────────────────────────────────────────────────
// Prueba de precisión del motor de clasificación de intenciones
// Ecoturismo La Yeguada OBC (TFG UNA)
//
// Entrena el modelo con las mismas intenciones, frases y entradas de la
// Base de Conocimiento que usa trainModel() en nlp.js, y evalúa un
// catálogo de frases de prueba distintas de las de entrenamiento.
// No escribe en la tabla de conversaciones, para no alterar las métricas.
//
// Uso:  node test/precision.test.js   (desde yeguada-backend/)
// ─────────────────────────────────────────────────────────────
const path = require('path');
const { NlpManager } = require('node-nlp');
const db = require('../db');
const catalogo = require('./frases_prueba.json');

// Mismos criterios que processMessage() en nlp.js — si esto se desalinea,
// la prueba mide un comportamiento que ya no es el real.
const RESOLUTION_THRESHOLD = db.getResolutionThreshold();
function esResuelta(r) {
  return r.intent !== 'None' && r.intent !== 'fuera.de.alcance' && r.score >= RESOLUTION_THRESHOLD;
}

async function main() {
  // Misma configuración que nlp.js; solo se desactivan el guardado y el registro de épocas en consola.
  const manager = new NlpManager({ languages: ['es'], forceNER: true, autoSave: false, nlu: { log: false } });
  const intents = db.listIntents();
  let frasesEntrenamiento = 0;
  for (const intent of intents) {
    for (const phrase of intent.examples) { manager.addDocument('es', phrase, intent.id); frasesEntrenamiento++; }
    manager.addAnswer('es', intent.id, intent.answer);
  }
  let kb = 0;
  for (const entry of db.listKb()) {
    if (!entry.intent_id) continue;
    manager.addDocument('es', entry.question, entry.intent_id); kb++;
  }
  await manager.train();

  const porIntencion = {};
  let correctas = 0, resueltas = 0, resueltasCorrectas = 0;
  const errores = [];
  for (const { frase, esperada } of catalogo.en_dominio) {
    const r = await manager.process('es', frase);
    const resuelta = esResuelta(r);
    const ok = r.intent === esperada;
    porIntencion[esperada] ??= { total: 0, correctas: 0, resueltas: 0 };
    porIntencion[esperada].total++;
    if (ok) { correctas++; porIntencion[esperada].correctas++; }
    if (resuelta) { resueltas++; porIntencion[esperada].resueltas++; }
    if (resuelta && ok) resueltasCorrectas++;
    if (!ok) errores.push({ frase, esperada, obtenida: r.intent, score: Number(r.score.toFixed(2)) });
  }

  let escaladas = 0;
  const fuera = [];
  for (const frase of catalogo.fuera_de_dominio) {
    const r = await manager.process('es', frase);
    const resuelta = esResuelta(r);
    if (!resuelta) escaladas++;
    fuera.push({ frase, obtenida: r.intent, score: Number(r.score.toFixed(2)), escalada: !resuelta });
  }

  const n = catalogo.en_dominio.length;
  const pct = (a, b) => Math.round((a / b) * 1000) / 10;
  const reporte = {
    fecha: new Date().toISOString(),
    intenciones: intents.length,
    frasesEntrenamiento,
    preguntasBaseConocimiento: kb,
    frasesPrueba: n,
    precisionGlobal: pct(correctas, n),
    tasaResolucionAutomatica: pct(resueltas, n),
    resueltasCorrectamente: pct(resueltasCorrectas, n),
    porIntencion: Object.fromEntries(Object.entries(porIntencion).map(([k, v]) =>
      [k, { ...v, precision: pct(v.correctas, v.total) }])),
    errores,
    fueraDeDominio: { total: catalogo.fuera_de_dominio.length, escaladas, tasaEscalamiento: pct(escaladas, catalogo.fuera_de_dominio.length), detalle: fuera },
  };
  const salida = path.join(__dirname, 'reporte_precision.json');
  require('fs').writeFileSync(salida, JSON.stringify(reporte, null, 2));
  console.log(`Precisión global: ${reporte.precisionGlobal}% (${correctas}/${n})`);
  console.log(`Resueltas automáticamente (score >= ${RESOLUTION_THRESHOLD}): ${reporte.tasaResolucionAutomatica}%`);
  console.log(`Fuera de dominio escaladas: ${escaladas}/${catalogo.fuera_de_dominio.length}`);
  console.log(`Reporte completo: ${salida}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
