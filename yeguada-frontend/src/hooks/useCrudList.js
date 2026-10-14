// hooks/useCrudList.js
// Estado de "lista con alta/edición/borrado" repetido casi idéntico entre
// Intents.jsx y KnowledgeBase.jsx (load/error/loading, formulario de
// alta-o-edición, guardar, borrar). Cada página define su propia forma de
// formulario y de payload — este hook solo orquesta el ciclo de vida.
import { useState, useEffect, useCallback } from 'react';

export function useCrudList({
  fetchFn, createFn, updateFn, deleteFn,
  emptyForm, toForm, toPayload, validate,
  getId = (item) => item.id,
  loadErrorMessage = 'No se pudo cargar — ¿el backend está corriendo?',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  function startAdd(initial) {
    setForm(initial ? { ...emptyForm, ...initial } : emptyForm);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(item) {
    setForm(toForm(item));
    setEditingId(getId(item));
    setAdding(true);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    const payload = toPayload(form);
    if (validate && !validate(payload)) return;

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateFn(editingId, payload);
      } else {
        await createFn(payload);
      }
      await load();
      cancelForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteFn(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return {
    items, loading, error, setError,
    adding, editingId, form, setForm, saving,
    load, startAdd, startEdit, cancelForm, handleSave, handleDelete,
  };
}
