// Caminho: /frontend/src/contexts/ObraContextDef.ts
// Objeto do contexto da obra ativa + contrato. Separado do ObraProvider para
// que ObraContext.tsx exporte apenas componentes (Fast Refresh /
// react-refresh/only-export-components).

import { createContext } from "react";

export interface ObraContextValue {
  obraAtivaId: string | null;
  selecionarObra: (id: string) => void;
  limparObraAtiva: () => void;
}

export const ObraContext = createContext<ObraContextValue | undefined>(undefined);
