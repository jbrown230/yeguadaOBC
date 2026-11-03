// context/ToastContext.jsx
// Avisos breves de resultado ("Intención guardada", errores, etc.).
//   const toast = useToast();
//   toast.success('Guardado');  toast.error('No se pudo…');  toast.info('…');
// Los errores duran más y se anuncian como alerta (lectores de pantalla).
import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';

const ToastContext = createContext(null);
const DURATION = { success: 3800, info: 4500, error: 7000 };
const MAX_VISIBLE = 3;
const ICONS = { success: 'check', error: 'close', info: 'bell' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tone, message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, tone, message, action: opts.action }]);
    timers.current.set(id, setTimeout(() => dismiss(id), opts.duration ?? DURATION[tone]));
    return id;
  }, [dismiss]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const api = useMemo(() => ({
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    info: (m, o) => push('info', m, o),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-viewport" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
              <span className="toast-icon"><Icon name={ICONS[t.tone]} size={14} strokeWidth={2.6} /></span>
              <span className="toast-msg">{t.message}</span>
              {t.action && (
                <button className="toast-action" onClick={() => { t.action.onClick(); dismiss(t.id); }}>{t.action.label}</button>
              )}
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso"><Icon name="close" size={13} /></button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
