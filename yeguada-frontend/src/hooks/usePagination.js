// hooks/usePagination.js
// Paginado del lado del cliente para listas ya cargadas por completo
// (chicas, y que además se usan sin paginar en otros lados — ej. el
// selector de intención en Base de Conocimiento). Para listas que pueden
// crecer sin límite, el backend pagina directo (ver Escalamientos/Dashboard).
import { useState, useMemo, useEffect } from 'react';

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  // Si la lista se achica (ej. un filtro de búsqueda) y la página actual
  // queda fuera de rango, vuelve a la última válida en vez de mostrar vacío.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return { page: safePage, totalPages, setPage, pageItems };
}
