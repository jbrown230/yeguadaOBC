// services/api/client.js
// Helper de fetch compartido por todos los módulos de services/api/.

export const BASE = '/api';

// Antes cada función repetía fetch→check res.ok→parsear a mano, con el orden
// de esos dos pasos inconsistente entre funciones: algunas revisaban res.ok
// antes de parsear (perdiendo el mensaje de error real del backend), otras
// parseaban primero (si el backend alguna vez devuelve un error no-JSON, ej.
// la página HTML por defecto de Express, res.json() lanza un SyntaxError
// confuso en vez del Error(data.error) esperado). Este helper lee el cuerpo
// como texto primero — nunca truena por un body no-JSON — y siempre intenta
// data.error antes de caer al mensaje genérico.
export async function request(path, { method = 'GET', body, errorLabel } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  if (text) {
    try { data = JSON.parse(text); } catch { /* respuesta no-JSON — data queda undefined */ }
  }

  if (!res.ok) {
    throw new Error(data?.error || `${errorLabel || path} error ${res.status}`);
  }
  return data;
}
