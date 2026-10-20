// services/api/kb.js
// Base de conocimiento — CRUD persistido en el backend.
import { request } from './client';

export async function fetchKb() {
  return request('/kb', { errorLabel: 'KB' });
}

export async function createKbEntry({ intentId, question, answer, tags }) {
  return request('/kb', { method: 'POST', body: { intentId, question, answer, tags }, errorLabel: 'KB' });
}

export async function updateKbEntry(id, { intentId, question, answer, tags }) {
  return request(`/kb/${id}`, { method: 'PUT', body: { intentId, question, answer, tags }, errorLabel: 'KB' });
}

export async function deleteKbEntry(id) {
  return request(`/kb/${id}`, { method: 'DELETE', errorLabel: 'KB' });
}
