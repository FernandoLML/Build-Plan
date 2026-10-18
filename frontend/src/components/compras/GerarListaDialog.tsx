// Caminho: /frontend/src/components/compras/GerarListaDialog.tsx
// Gera uma lista de compras a partir de uma etapa (POST /api/etapas/:etapaId/lista-compras).

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEtapas } from "@/hooks/useMateriais";
import { useGerarLista } from "@/hooks/useCompras";

interface GerarListaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
}

export function GerarListaDialog({ open, onOpenChange, obraId }: GerarListaDialogProps) {
  const { data: etapas } = useEtapas(obraId);
  const gerar = useGerarLista(obraId);
  const [etapaId, setEtapaId] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEtapaId(undefined);
      setErro(null);
    }
  }, [open]);

  function handleGerar() {
    if (!etapaId) {
      setErro("Selecione uma etapa.");
      return;
    }
    gerar.mutate(etapaId, {
      onSuccess: () => onOpenChange(false),
      onError: (e) =>
        setErro(
          e instanceof AxiosError
            ? (e.response?.data as { message?: string })?.message ?? "Erro ao gerar a lista."
            : "Erro ao gerar a lista.",
        ),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Gerar lista de compras</DialogTitle>
          <DialogDescription>
            A lista é um snapshot dos materiais vinculados à etapa selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <Label>Etapa</Label>
            <Select value={etapaId} onValueChange={(v) => setEtapaId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={gerar.isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleGerar} disabled={gerar.isPending}>
              {gerar.isPending ? "Gerando…" : "Gerar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}