// hooks/useCrudList.js
// Ciclo de vida de una "lista con alta/edición/borrado" (Intents y Base de Conocimiento):
// carga, panel de edición, validación por campo, guardado, borrado con confirmación y
// avisos de resultado. Cada página define su forma de formulario y de payload.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export function useCrudList({
  fetchFn, createFn, updateFn, deleteFn,
  emptyForm, toForm, toPayload,
  validate,                       // (form) => ({ campo: 'mensaje' }) — vacío = válido
  getId = (item) => item.id,
  loadErrorMessage = 'No se pudo cargar — ¿el backend está corriendo?',
  messages = {},                  // { created, updated, deleted } textos de los avisos
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);       // panel abierto
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const initialRef = useRef(JSON.stringify(emptyForm));

  const dirty = adding && JSON.stringify(form) !== initialRef.current;

  const load = useCallback(async () => {
    try {
      setItems(await fetchFn());
      setError(null);
    } catch {
      setError(loadErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, loadErrorMessage]);

  useEffect(() => { load(); }, [load]);

  function open(nextForm, id) {
    setForm(nextForm);
    initialRef.current = JSON.stringify(nextForm);
    setEditingId(id);
    setErrors({});
    setAdding(true);
  }
  const startAdd = (initial) => open(initial ? { ...emptyForm, ...initial } : emptyForm, null);
  const startEdit = (item) => open(toForm(item), getId(item));

  const closeNow = useCallback(() => {
    setAdding(false);
    setEditingId(null);
    setErrors({});
  }, []);

  // Cerrar con confirmación si hay cambios sin guardar
  const requestClose = useCallback(async () => {
    if (saving) return;
    if (dirty && !(await confirm({
      title: '¿Descartar los cambios?',
      message: 'Hiciste modificaciones que no se han guardado.',
      confirmLabel: 'Descartar',
      cancelLabel: 'Seguir editando',
      tone: 'danger',
    }))) return;
    closeNow();
  }, [saving, dirty, confirm, closeNow]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  async function handleSave(e) {
    e?.preventDefault();
    if (saving) return;
    const found = validate ? validate(form) : {};
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      document.querySelector('.sheet [aria-invalid="true"], .sheet .invalid input')?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId !== null) await updateFn(editingId, payload);
      else await createFn(payload);
      toast.success(editingId !== null ? (messages.updated || 'Cambios guardados') : (messages.created || 'Creado correctamente'));
      closeNow();
      await load();
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  // `ask`: { title, message, confirmLabel } — texto del diálogo de confirmación
  async function handleDelete(item, ask) {
    const ok = await confirm({ confirmLabel: 'Eliminar', tone: 'danger', ...ask });
    if (!ok) return;
    try {
      await deleteFn(getId(item));
      toast.success(messages.deleted || 'Eliminado correctamente');
      await load();
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar. Inténtalo de nuevo.');
    }
  }

  return {
    items, loading, error,
    adding, editingId, form, setField, errors, saving, dirty,
    load, startAdd, startEdit, requestClose, handleSave, handleDelete,
  };
}
