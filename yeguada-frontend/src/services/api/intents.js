// services/api/intents.js
// Intenciones NLP — CRUD persistido en el backend (ver yeguada-backend/db.js).
import { request } from './client';

export async function fetchIntents() {
  return request('/intents', { errorLabel: 'Intents' });
}

export async function createIntent({ name, answer, examples }) {
  return request('/intents', { method: 'POST', body: { name, answer, examples }, errorLabel: 'Intents' });
}

export async function updateIntent(id, { name, answer, examples }) {
  return request(`/intents/${encodeURIComponent(id)}`, { method: 'PUT', body: { name, answer, examples }, errorLabel: 'Intents' });
}

export async function deleteIntent(id) {
  return request(`/intents/${encodeURIComponent(id)}`, { method: 'DELETE', errorLabel: 'Intents' });
}
