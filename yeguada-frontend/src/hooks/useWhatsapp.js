// hooks/useWhatsapp.js
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchWhatsappStatus, connectWhatsapp, disconnectWhatsapp, reconnectWhatsapp,
} from '../services/api';

const FAST_POLL = 2000;  // mientras se espera el QR o se está conectando
const SLOW_POLL = 15000; // conectado o desconectado en reposo
const FAST_STATES = ['initializing', 'qr', 'authenticated'];

export function useWhatsapp() {
  const [status, setStatus] = useState({ status: 'disconnected', qr: null, info: null });
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const scheduleNext = useCallback((currentStatus) => {
    clearTimeout(timerRef.current);
    const delay = FAST_STATES.includes(currentStatus) ? FAST_POLL : SLOW_POLL;
    timerRef.current = setTimeout(tick, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function tick() {
    try {
      const data = await fetchWhatsappStatus();
      if (!mountedRef.current) return;
      setUnavailable(false);
      setStatus(data);
      scheduleNext(data.status);
    } catch {
      if (!mountedRef.current) return;
      setUnavailable(true);
      scheduleNext('disconnected');
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    tick();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runAction = useCallback(async (fn) => {
    setBusy(true);
    try {
      const data = await fn();
      if (mountedRef.current) {
        setUnavailable(false);
        setStatus(data);
        scheduleNext(data.status);
      }
    } catch {
      if (mountedRef.current) setUnavailable(true);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [scheduleNext]);

  const connect = useCallback(() => runAction(connectWhatsapp), [runAction]);
  const disconnect = useCallback(() => runAction(disconnectWhatsapp), [runAction]);
  const reconnect = useCallback(() => runAction(reconnectWhatsapp), [runAction]);

  return { status, busy, unavailable, connect, disconnect, reconnect };
}
