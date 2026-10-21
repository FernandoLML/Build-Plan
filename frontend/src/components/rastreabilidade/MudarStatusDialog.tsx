// Caminho: /frontend/src/components/rastreabilidade/MudarStatusDialog.tsx
// Confirma a transição de status (RN01) com observação opcional.

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { mudarStatusSchema, PROXIMO_STATUS, STATUS_LABEL } from "@/types/rastreabilidade";
import type { MudarStatusValues } from "@/types/rastreabilidade";
import type { VinculoMaterialEtapa } from "@/types/material";
import { useAtualizarStatusVinculo } from "@/hooks/useRastreabilidade";

interface MudarStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vinculo: VinculoMaterialEtapa | null;
  etapaId: string;
  obraId: string;
}

export function MudarStatusDialog({ open, onOpenChange, vinculo, etapaId, obraId }: MudarStatusDialogProps) {
  const atualizar = useAtualizarStatusVinculo(obraId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<MudarStatusValues>({ resolver: zodResolver(mudarStatusSchema) });

  useEffect(() => {
    if (open) {
      setErro(null);
      reset({ detalhes: "" });
    }
  }, [open, reset]);

  const proximo = vinculo ? PROXIMO_STATUS[vinculo.status] : null;

  function onSubmit(values: MudarStatusValues) {
    if (!vinculo || !proximo) return;
    setErro(null);
    atualizar.mutate(
      {
        vinculoId: vinculo.id,
        etapaId,
        payload: { status: proximo, detalhes: values.detalhes ? values.detalhes : undefined },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ?? "Erro ao mudar o status."
              : "Erro ao mudar o status.",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Avançar status</DialogTitle>
          <DialogDescription>
            {vinculo && proximo
              ? `${vinculo.material?.nome ?? "Material"}: ${STATUS_LABEL[vinculo.status]} → ${STATUS_LABEL[proximo]}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <Label htmlFor="detalhes">Observação (opcional)</Label>
            <textarea
              id="detalhes"
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-slate-500"
              placeholder="Ex.: Material recebido no canteiro em bom estado."
              {...register("detalhes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={atualizar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizar.isPending || !proximo}>
              {atualizar.isPending ? "Salvando…" : `Confirmar: ${proximo ? STATUS_LABEL[proximo] : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}