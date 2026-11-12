// Caminho: /frontend/src/contexts/ObraContext.tsx
// Gerencia a OBRA ATIVA (selecionada), persistida no localStorage para
// fornecer o obraId às Telas 2–6.

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ObraContext, type ObraContextValue } from "./ObraContextDef";

const STORAGE_KEY = "buildplan.obraAtiva";

function lerObraSalva(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null; // storage indisponível (modo privado/bloqueado)
  }
}

export function ObraProvider({ children }: { children: ReactNode }) {
  // Restaura a obra ativa salva já no primeiro render (inicialização lazy),
  // sem o render extra de um useEffect + setState.
  const [obraAtivaId, setObraAtivaId] = useState<string | null>(() => lerObraSalva());

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