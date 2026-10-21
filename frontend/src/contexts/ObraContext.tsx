// Caminho: /frontend/src/contexts/ObraContext.tsx
// Gerencia a OBRA ATIVA (selecionada), persistida no localStorage para
// fornecer o obraId às Telas 2–6.

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "buildplan.obraAtiva";

export interface ObraContextValue {
  obraAtivaId: string | null;
  selecionarObra: (id: string) => void;
  limparObraAtiva: () => void;
}

export const ObraContext = createContext<ObraContextValue | undefined>(undefined);

export function ObraProvider({ children }: { children: ReactNode }) {
  const [obraAtivaId, setObraAtivaId] = useState<string | null>(null);

  // Restaura a obra ativa salva ao montar.
  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) setObraAtivaId(salvo);
  }, []);

  const selecionarObra = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setObraAtivaId(id);
  }, []);

  const limparObraAtiva = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setObraAtivaId(null);
  }, []);

  const value = useMemo<ObraContextValue>(
    () => ({ obraAtivaId, selecionarObra, limparObraAtiva }),
    [obraAtivaId, selecionarObra, limparObraAtiva],
  );

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}