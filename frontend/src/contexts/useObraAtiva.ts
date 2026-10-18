// Caminho: /frontend/src/contexts/useObraAtiva.ts
// Hook de acesso à obra ativa, com guarda de uso fora do provider.

import { useContext } from "react";
import { ObraContext } from "./ObraContext";
import type { ObraContextValue } from "./ObraContext";

export function useObraAtiva(): ObraContextValue {
  const ctx = useContext(ObraContext);
  if (!ctx) {
    throw new Error("useObraAtiva deve ser usado dentro de <ObraProvider>.");
  }
  return ctx;
}