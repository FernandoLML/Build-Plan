// Caminho: /frontend/src/components/compras/InformarPrecoDialog.tsx
// Modal "Informar preço" — PATCH /itens-compra/:id. Mostra o subtotal previsto.

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { informarPrecoSchema } from "@/types/compras";
import type { InformarPrecoValues, ItemCompra } from "@/types/compras";
import { useAtualizarItemCompra } from "@/hooks/useCompras";
import { formatarMoeda } from "@/lib/format";

interface InformarPrecoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemCompra | null;
  obraId: string;
}

export function InformarPrecoDialog({ open, onOpenChange, item, obraId }: InformarPrecoDialogProps) {
  const atualizar = useAtualizarItemCompra(obraId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InformarPrecoValues>({ resolver: zodResolver(informarPrecoSchema) });

  useEffect(() => {
    if (open && item) {
      setErro(null);
      reset({ precoUnitario: item.precoUnitario ? Number(item.precoUnitario) : 0 });
    }
  }, [open, item, reset]);

  const quantidade = Number(item?.quantidade ?? 0);
  const precoDigitado = Number(watch("precoUnitario"));
  const subtotal = Number.isNaN(precoDigitado) ? 0 : precoDigitado * quantidade;

  function onSubmit(values: InformarPrecoValues) {
    if (!item) return;
    setErro(null);
    atualizar.mutate(
      { id: item.id, payload: { precoUnitario: values.precoUnitario } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ?? "Erro ao salvar o preço."
              : "Erro ao salvar o preço.",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Informar preço</DialogTitle>
          <DialogDescription>{item ? item.descricao : ""}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <Label htmlFor="precoUnitario">Preço unitário (R$)</Label>
            <Input id="precoUnitario" type="number" step="0.01" {...register("precoUnitario")} />
            {errors.precoUnitario && (
              <p className="text-xs text-red-600">{errors.precoUnitario.message}</p>
            )}
          </div>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Subtotal previsto </span>
            <span className="font-medium">
              ({quantidade} × preço) = {formatarMoeda(subtotal)}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={atualizar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizar.isPending}>
              {atualizar.isPending ? "Salvando…" : "Salvar preço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}