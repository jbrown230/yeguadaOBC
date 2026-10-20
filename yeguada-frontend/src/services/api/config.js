// services/api/config.js
// Configuración (umbral de confianza, números de staff) — persistida en el backend.
import { request } from './client';

export async function fetchConfig() {
  return request('/config', { errorLabel: 'Config' });
}

export async function updateConfig({ resolutionThreshold, staffWhatsappNumbers }) {
  return request('/config', { method: 'PUT', body: { resolutionThreshold, staffWhatsappNumbers }, errorLabel: 'Config' });
}
