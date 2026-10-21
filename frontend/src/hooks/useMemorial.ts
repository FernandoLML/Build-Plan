// Caminho: /frontend/src/hooks/useMemorial.ts
// Mutações do UC01: pré-visualização (extração) e importação (consolidação).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memorialApi } from "@/api/memorial";
import type { ItemMemorial } from "@/types/memorial";

/** Pré-visualiza o CSV do memorial (não persiste). */
export function usePreviewMemorial(obraId: string | null) {
  return useMutation({
    mutationFn: (csv: string) => memorialApi.preview(obraId as string, csv),
  });
}

/** Importa os itens revisados e invalida os caches afetados. */
export function useImportarMemorial(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itens: ItemMemorial[]) => memorialApi.importar(obraId as string, itens),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}