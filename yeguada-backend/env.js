// Carga yeguada-backend/.env (si existe) antes que cualquier otro módulo.
// No pisa variables que ya vengan del entorno (hosting, CI, `export`...).
// Requiere Node 20.12+ (process.loadEnvFile).
const path = require('path');

try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err; // sin .env: se usan los valores por defecto
}
