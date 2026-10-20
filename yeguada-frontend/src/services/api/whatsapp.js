// services/api/whatsapp.js
// Control del bot de WhatsApp (whatsapp-web.js).
import { request } from './client';

export async function fetchWhatsappStatus() {
  return request('/whatsapp/status', { errorLabel: 'WhatsApp status' });
}

export async function connectWhatsapp() {
  return request('/whatsapp/connect', { method: 'POST', errorLabel: 'WhatsApp connect' });
}

export async function disconnectWhatsapp() {
  return request('/whatsapp/disconnect', { method: 'POST', errorLabel: 'WhatsApp disconnect' });
}

export async function reconnectWhatsapp() {
  return request('/whatsapp/reconnect', { method: 'POST', errorLabel: 'WhatsApp reconnect' });
}
