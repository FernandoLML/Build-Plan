// Caminho: /frontend/src/hooks/useDebounce.ts
// Debounce genérico de valor (evita disparar a busca a cada tecla).

import { useEffect, useState } from "react";

export function useDebounce<T>(valor: T, atrasoMs = 300): T {
  const [debounced, setDebounced] = useState<T>(valor);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), atrasoMs);
    return () => clearTimeout(id);
  }, [valor, atrasoMs]);

  return debounced;
}