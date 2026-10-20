// services/api/escalations.js
// Escalamientos a humano (paginado del lado del backend).
import { request } from './client';

export async function fetchEscalations({ all = false, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  if (all) params.set('all', 'true');
  return request(`/escalations?${params}`, { errorLabel: 'Escalations' });
}

export async function markEscalationHandled(id) {
  return request(`/escalations/${id}/handle`, { method: 'PUT', errorLabel: 'Escalations' });
}
