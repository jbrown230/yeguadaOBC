// services/api/conversations.js
import { request } from './client';

export async function fetchConversationHistory(sessionId) {
  return request(`/conversations/${encodeURIComponent(sessionId)}`, { errorLabel: 'Conversations' });
}

// Historial completo de conversaciones (paginado del lado del backend).
export async function fetchConversations({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  return request(`/conversations?${params}`, { errorLabel: 'Conversations' });
}
