// Caminho: /frontend/src/lib/sinapi.ts
// Referência regional padrão do catálogo SINAPI usada no autocomplete de preços.
// Espelha os defaults do backend (backend/src/config/sinapi.config.ts — SC, sem
// desoneração) para que a sugestão bata com a precificação automática da lista.
// Override por env: VITE_SINAPI_UF / VITE_SINAPI_REGIME.

import type { RegimeSinapi } from "@/types/sinapi";

const REGIMES: ReadonlySet<string> = new Set<RegimeSinapi>(["DESONERADO", "NAO_DESONERADO"]);

function ehRegime(valor: string | undefined): valor is RegimeSinapi {
  return valor !== undefined && REGIMES.has(valor);
}

export function resolverReferenciaSinapi(env: {
  VITE_SINAPI_UF?: string;
  VITE_SINAPI_REGIME?: string;
}): { uf: string; regime: RegimeSinapi } {
  const uf = env.VITE_SINAPI_UF?.trim().toUpperCase();
  const regime = env.VITE_SINAPI_REGIME?.trim().toUpperCase();
  return {
    uf: uf && /^[A-Z]{2}$/.test(uf) ? uf : "SC",
    regime: ehRegime(regime) ? regime : "NAO_DESONERADO",
  };
}

export const SINAPI_REFERENCIA = resolverReferenciaSinapi(import.meta.env);
