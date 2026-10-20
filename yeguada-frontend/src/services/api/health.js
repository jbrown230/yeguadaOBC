// services/api/health.js
import { BASE } from './client';

export async function checkHealth() {
  try { const res = await fetch(`${BASE}/health`); return res.ok; }
  catch { return false; }
}
