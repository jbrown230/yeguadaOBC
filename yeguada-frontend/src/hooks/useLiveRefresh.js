// hooks/useLiveRefresh.js
// Patrón repetido en varias páginas: llamar ahora, sondear cada N ms, y
// refrescar al instante cuando algo dispara 'yeguada:metrics:updated'
// (ej. se envía un mensaje de chat, o se limpia el historial).
// useMetrics.js no usa esto — tiene requisitos propios (caché, dedupe,
// fallback offline) que no valía la pena forzar en un hook genérico.
import { useEffect } from 'react';

const EVENT = 'yeguada:metrics:updated';

export function useLiveRefresh(callback, interval = 30000) {
  useEffect(() => {
    callback();
    const id = setInterval(callback, interval);
    window.addEventListener(EVENT, callback);
    return () => {
      clearInterval(id);
      window.removeEventListener(EVENT, callback);
    };
  }, [callback, interval]);
}
