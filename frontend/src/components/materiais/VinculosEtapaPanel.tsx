// Caminho: /frontend/src/components/materiais/VinculosEtapaPanel.tsx
// Aba de vínculos: escolhe uma etapa e lista/remove os vínculos dela.

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EtapaFormDialog } from "@/components/materiais/EtapaFormDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEtapas, useExcluirVinculo, useVinculosPorEtapa } from "@/hooks/useMateriais";
import type { StatusVinculo } from "@/types/material";

const STATUS_LABEL: Record<StatusVinculo, string> = {
  PREVISTO: "Previsto",
  RECEBIDO: "Recebido",
  APLICADO: "Aplicado",
};

export function VinculosEtapaPanel({ obraId }: { obraId: string }) {
  const { data: etapas } = useEtapas(obraId);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const [novaEtapaOpen, setNovaEtapaOpen] = useState(false);
  const { data: vinculos, isLoading } = useVinculosPorEtapa(etapaId);
  const excluir = useExcluirVinculo(obraId);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="max-w-sm flex-1 space-y-1">
          <label className="text-sm font-medium text-slate-700">Etapa</label>
          <Select value={etapaId ?? undefined} onValueChange={(v) => setEtapaId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa para ver os vínculos" />
            </SelectTrigger>
            <SelectContent>
              {etapas?.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => setNovaEtapaOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nova etapa
        </Button>
      </div>

      <EtapaFormDialog
        open={novaEtapaOpen}
        onOpenChange={setNovaEtapaOpen}
        obraId={obraId}
        onCriada={(id) => setEtapaId(id)}
      />

      {!etapaId && (
        <p className="text-sm text-slate-500">Escolha uma etapa acima para listar os vínculos.</p>
      )}

      {etapaId && isLoading && <p className="text-sm text-slate-500">Carregando vínculos…</p>}

      {etapaId && !isLoading && vinculos && vinculos.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum material vinculado a esta etapa.</p>
      )}

      {etapaId && vinculos && vinculos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.material?.nome ?? "—"}</TableCell>
                  <TableCell>{v.material?.unidade ?? "—"}</TableCell>
                  <TableCell className="text-right">{v.quantidade}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABEL[v.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{v.local ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => excluir.mutate({ id: v.id, etapaId })}
                      disabled={excluir.isPending}
                      title="Remover vínculo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}