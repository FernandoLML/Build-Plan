// Caminho: /frontend/src/hooks/useSinapi.ts
// Busca no catálogo SINAPI para autocomplete. A query só é habilitada a partir
// de 2 caracteres — mantém os testes existentes sem chamadas de rede.

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { sinapiApi } from "@/api/sinapi";
import type { BuscarSinapiParams } from "@/types/sinapi";

export function useBuscaSinapi(params: BuscarSinapiParams, habilitado = true) {
  const termo = params.q.trim();
  return useQuery({
    queryKey: ["sinapi", { ...params, q: termo }],
    queryFn: () => sinapiApi.buscar({ ...params, q: termo }),
    enabled: habilitado && termo.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // catálogo é batch mensal; cache generoso.
  });
}