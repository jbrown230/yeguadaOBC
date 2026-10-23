// yeguada-backend/test/precision_v2.js
//
// Script NUEVO e independiente de test/precision.test.js (no lo modifica ni
// lo reemplaza). Replica exactamente su misma lógica de entrenamiento y de
// "resuelto" (esResuelta), para medir precisión sobre un catálogo de frases
// de prueba distinto, pasado por argumento.
//
// No reentrena ni guarda el modelo real (autoSave: false, igual que
// precision.test.js) — construye un NlpManager temporal en memoria,
// solo para medir, igual que el script original.
//
// Uso:
//   node test/precision_v2.js <catalogo.json> <salida.json> [--exclude "frase1|||frase2|||..."]

const path = require('path');
const fs = require('fs');
const { NlpManager } = require('node-nlp');
const db = require('../db');

const RESOLUTION_THRESHOLD = db.getResolutionThreshold();
function esResuelta(r) {
  return r.intent !== 'None' && r.intent !== 'fuera.de.alcance' && r.score >= RESOLUTION_THRESHOLD;
}

async function main() {
  const [, , catalogoArg, salidaArg, flag, excludeArg] = process.argv;
  if (!catalogoArg || !salidaArg) {
    console.error('Uso: node test/precision_v2.js <catalogo.json> <salida.json> [--exclude "frase1|||frase2"]');
    process.exit(1);
  }

  const excludeSet = new Set();
  if (flag === '--exclude' && excludeArg) {
    for (const f of excludeArg.split('|||')) excludeSet.add(f);
  }

  const catalogoPath = path.join(__dirname, '..', catalogoArg);
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
  const enDominio = catalogo.en_dominio.filter((item) => !excludeSet.has(item.frase));
  const fueraDeDominio = catalogo.fuera_de_dominio;

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
  for (const { frase, esperada } of enDominio) {
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
  for (const frase of fueraDeDominio) {
    const r = await manager.process('es', frase);
    const resuelta = esResuelta(r);
    if (!resuelta) escaladas++;
    fuera.push({ frase, obtenida: r.intent, score: Number(r.score.toFixed(2)), escalada: !resuelta });
  }

  const n = enDominio.length;
  const pct = (a, b) => Math.round((a / b) * 1000) / 10;
  const reporte = {
    fecha: new Date().toISOString(),
    catalogoUsado: catalogoArg,
    frasesExcluidas: [...excludeSet],
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
    fueraDeDominio: { total: fueraDeDominio.length, escaladas, tasaEscalamiento: pct(escaladas, fueraDeDominio.length), detalle: fuera },
  };

  const salida = path.join(__dirname, path.basename(salidaArg));
  fs.writeFileSync(salida, JSON.stringify(reporte, null, 2));
  console.log(`Precisión global: ${reporte.precisionGlobal}% (${correctas}/${n})`);
  console.log(`Resueltas automáticamente (score >= ${RESOLUTION_THRESHOLD}): ${reporte.tasaResolucionAutomatica}%`);
  console.log(`Fuera de dominio escaladas: ${escaladas}/${fueraDeDominio.length}`);
  console.log(`Reporte completo: ${salida}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
