// Caminho: /frontend/src/components/materiais/EtapaFormDialog.tsx
// Modal simples para criar uma etapa (POST /api/obras/:obraId/etapas).

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { etapaFormSchema } from "@/types/etapa";
import type { EtapaFormValues } from "@/types/etapa";
import { useCriarEtapa } from "@/hooks/useMateriais";

interface EtapaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  onCriada?: (etapaId: string) => void; // permite auto-selecionar a etapa criada
}

export function EtapaFormDialog({ open, onOpenChange, obraId, onCriada }: EtapaFormDialogProps) {
  const criar = useCriarEtapa(obraId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EtapaFormValues>({ resolver: zodResolver(etapaFormSchema) });

  useEffect(() => {
    if (open) {
      setErro(null);
      reset({ nome: "", ordem: undefined });
    }
  }, [open, reset]);

  function onSubmit(values: EtapaFormValues) {
    setErro(null);
    criar.mutate(
      { nome: values.nome, ordem: values.ordem },
      {
        onSuccess: (etapa) => {
          onCriada?.(etapa.id);
          onOpenChange(false);
        },
        onError: (e) =>
          setErro(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ?? "Erro ao criar etapa."
              : "Erro ao criar etapa.",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova etapa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <Label htmlFor="etapa-nome">Nome</Label>
            <Input id="etapa-nome" placeholder="Ex.: Fundação" {...register("nome")} />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="etapa-ordem">Ordem (opcional)</Label>
            <Input id="etapa-ordem" type="number" {...register("ordem")} />
            {errors.ordem && <p className="text-xs text-red-600">{errors.ordem.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={criar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? "Criando…" : "Criar etapa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}