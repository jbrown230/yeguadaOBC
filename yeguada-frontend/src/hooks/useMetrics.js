// hooks/useMetrics.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMetrics, checkHealth, getLocalMetrics, MOCK_METRICS } from '../services/api';

const LS_KEY = 'yeguada_metrics_cache';

function loadCache() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveCache(data, timeStr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...data, _ts: timeStr })); }
  catch {}
}

export function useMetrics(pollInterval = 30000) {
  const [metrics, setMetrics] = useState(() => {
    const cache = loadCache();
    if (cache) { const { _ts, ...data } = cache; return data; }
    // Si no hay cache del backend, usar métricas locales acumuladas
    const local = getLocalMetrics();
    return local.totalChatsToday > 0 ? local : MOCK_METRICS;
  });
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const cache = loadCache();
    return cache?._ts || null;
  });
  const prevRef = useRef(null);

  const load = useCallback(async () => {
    const healthy = await checkHealth();
    setBackendOnline(prev => prev !== healthy ? healthy : prev);

    if (healthy) {
      try {
        const data = await fetchMetrics();
        const serialized = JSON.stringify(data);
        if (serialized !== prevRef.current) {
          prevRef.current = serialized;
          const ts = new Date().toLocaleTimeString('es');
          saveCache(data, ts);
          setMetrics(data);
          setLastUpdated(ts);
        }
      } catch {}
    } else {
      // Backend offline: usar métricas acumuladas localmente por el chat
      const local = getLocalMetrics();
      const serialized = JSON.stringify(local);
      if (serialized !== prevRef.current) {
        prevRef.current = serialized;
        setMetrics(local);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, pollInterval);
    // Actualizar dashboard inmediatamente cuando el chat registra una nueva conversación
    window.addEventListener('yeguada:metrics:updated', load);
    return () => {
      clearInterval(interval);
      window.removeEventListener('yeguada:metrics:updated', load);
    };
  }, [load, pollInterval]);

  return { metrics, backendOnline, loading, lastUpdated, refresh: load };
}