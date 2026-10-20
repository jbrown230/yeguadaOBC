// services/api/chat.js
import { request } from './client';
import { recordLocalConversation } from './localMetrics';

export async function sendMessage(message, sessionId = 'admin-preview') {
  const t0 = Date.now();
  const data = await request('/chat', { method: 'POST', body: { message, sessionId }, errorLabel: 'NLP' });
  // Registrar en localStorage también cuando backend responde
  recordLocalConversation({ sessionId, message, ...data, responseTimeMs: Date.now() - t0 });
  return data;
}
