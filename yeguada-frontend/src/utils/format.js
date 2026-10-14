// utils/format.js
// Formato de fecha repetido literalmente en Dashboard.jsx y Escalations.jsx
// (tabla, con año) y en el modal de historial de Dashboard (sin año).
export function formatDateTime(iso, { withYear = true } = {}) {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: '2-digit',
    ...(withYear ? { year: '2-digit' } : {}),
    hour: '2-digit', minute: '2-digit',
  });
}
