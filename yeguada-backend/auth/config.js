// Parámetros de autenticación (sobrescribibles por variables de entorno).
const env = process.env;
const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);

module.exports = {
  // admin: todo + gestión de usuarios. operador: panel, escalamientos y monitoreo (lectura).
  ROLES: ['admin', 'operador'],
  COOKIE_NAME: 'yeguada_session',
  SESSION_TTL_MS: num(env.SESSION_TTL_DAYS, 7) * 24 * 3600 * 1000,       // sesión deslizante
  RESET_TTL_MS: num(env.RESET_TTL_MINUTES, 30) * 60 * 1000,
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_MS: 15 * 60 * 1000,
  IS_PROD: env.NODE_ENV === 'production',
  // Pantalla / endpoint de "crear primer administrador". Abierta en desarrollo;
  // en producción queda CERRADA salvo ALLOW_SETUP=true (ver auth/seed.js).
  SETUP_ENABLED: env.ALLOW_SETUP === 'true' || env.NODE_ENV !== 'production',
  // URL pública del dashboard — se usa para armar los enlaces de los correos.
  APP_URL: (env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  // Origen permitido para CORS con credenciales.
  CORS_ORIGIN: env.CORS_ORIGIN || env.APP_URL || 'http://localhost:3000',
};
