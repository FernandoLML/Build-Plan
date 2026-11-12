// Caminho: /frontend/src/lib/sinapi.ts
// Referência regional padrão do catálogo SINAPI usada no autocomplete de preços.
// Espelha os defaults do backend (backend/src/config/sinapi.config.ts — SC, sem
// desoneração) para que a sugestão bata com a precificação automática da lista.
// Override por env: VITE_SINAPI_UF / VITE_SINAPI_REGIME.

import type { RegimeSinapi } from "@/types/sinapi";

const REGIMES: readonly RegimeSinapi[] = ["DESONERADO", "NAO_DESONERADO"];

export function resolverReferenciaSinapi(env: {
  VITE_SINAPI_UF?: string;
  VITE_SINAPI_REGIME?: string;
}): { uf: string; regime: RegimeSinapi } {
  const uf = env.VITE_SINAPI_UF?.trim().toUpperCase();
  const regime = env.VITE_SINAPI_REGIME?.trim().toUpperCase() as RegimeSinapi | undefined;
  return {
    uf: uf && /^[A-Z]{2}$/.test(uf) ? uf : "SC",
    regime: regime && REGIMES.includes(regime) ? regime : "NAO_DESONERADO",
  };
}

export const SINAPI_REFERENCIA = resolverReferenciaSinapi(import.meta.env);
