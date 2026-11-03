// context/ConfirmContext.jsx
// Diálogo de confirmación propio (reemplaza window.confirm, que bloquea y no se puede estilizar).
//   const confirm = useConfirm();
//   if (await confirm({ title: '¿Eliminar?', message: '…', confirmLabel: 'Eliminar', tone: 'danger' })) { … }
// Resuelve true al confirmar y false al cancelar / Esc / tocar fuera.
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ConfirmContext = createContext(null);

function ConfirmDialog({ opts, onResult }) {
  const cancelRef = useRef(null);
  const danger = opts.tone === 'danger';

  useEffect(() => {
    // En acciones destructivas el foco inicial es "Cancelar": Enter nunca borra por accidente.
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onResult(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResult]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={() => onResult(false)}>
      <div className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" onMouseDown={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="confirm-title">{opts.title}</h2>
        {opts.message && <div id="confirm-msg" className="confirm-msg">{opts.message}</div>}
        <div className="confirm-actions">
          <button ref={cancelRef} className="btn btn-secondary" onClick={() => onResult(false)}>{opts.cancelLabel || 'Cancelar'}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => onResult(true)}>{opts.confirmLabel || 'Confirmar'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { opts, resolve }

  const confirm = useCallback((opts) => new Promise((resolve) => setState({ opts, resolve })), []);
  const onResult = useCallback((value) => {
    setState((s) => { s?.resolve(value); return null; });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog opts={state.opts} onResult={onResult} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
