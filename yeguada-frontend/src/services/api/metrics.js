// services/api/metrics.js
import { request } from './client';

export async function fetchMetrics() {
  return request('/metrics', { errorLabel: 'Metrics' });
}

export async function fetchTimeseries() {
  return request('/metrics/timeseries', { errorLabel: 'Timeseries' });
}

export async function resetBackendMetrics() {
  try {
    await request('/metrics/reset', { method: 'DELETE' });
  } catch {} // si el backend está offline no importa, el localStorage ya fue limpiado
}
