// services/api/index.js
// Punto de entrada único: reexporta todos los módulos de esta carpeta para
// que el resto del frontend siga importando con `from '../services/api'`
// sin tener que saber en qué archivo vive cada función.

export * from './chat';
export * from './metrics';
export * from './conversations';
export * from './escalations';
export * from './intents';
export * from './kb';
export * from './config';
export * from './whatsapp';
export * from './health';
export * from './localMetrics';
