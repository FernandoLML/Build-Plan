// Caminho: /frontend/src/components/compras/InformarPrecoDialog.tsx
// Modal "Informar preço" — PATCH /itens-compra/:id. Mostra o subtotal previsto.
// Inclui busca no catálogo SINAPI (autocomplete) que preenche o preço unitário.

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Search } from "lucide-react";
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
import type { ItemSinapi } from "@/types/sinapi";
import { useAtualizarItemCompra } from "@/hooks/useCompras";
import { useBuscaSinapi } from "@/hooks/useSinapi";
import { useDebounce } from "@/hooks/useDebounce";
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

  // Busca SINAPI (autocomplete).
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 300);
  const { data: sugestoes, isFetching } = useBuscaSinapi({ q: buscaDebounced, limit: 8 }, open);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InformarPrecoValues>({ resolver: zodResolver(informarPrecoSchema) });

  useEffect(() => {
    if (open && item) {
      setErro(null);
      setBusca("");
      reset({ precoUnitario: item.precoUnitario ? Number(item.precoUnitario) : 0 });
    }
  }, [open, item, reset]);

  const quantidade = Number(item?.quantidade ?? 0);
  const precoDigitado = Number(watch("precoUnitario"));
  const subtotal = Number.isNaN(precoDigitado) ? 0 : precoDigitado * quantidade;

  function aplicarReferencia(ref: ItemSinapi) {
    setValue("precoUnitario", Number(ref.precoMediano), { shouldValidate: true, shouldDirty: true });
    setBusca("");
  }

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
          {erro && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>}

          {/* Busca de referência SINAPI */}
          <div className="space-y-1">
            <Label htmlFor="busca-sinapi">Referência SINAPI (opcional)</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="busca-sinapi"
                className="pl-8"
                placeholder="Buscar insumo por descrição ou código…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />

              {/* Lista flutuante — sobrepõe o modal sem deslocar os campos abaixo */}
              {buscaDebounced.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-800 bg-slate-900 shadow-lg">
                  {isFetching && <p className="px-3 py-2 text-xs text-slate-500">Buscando…</p>}
                  {!isFetching && (!sugestoes || sugestoes.length === 0) && (
                    <p className="px-3 py-2 text-xs text-slate-500">Nenhum item encontrado.</p>
                  )}
                  {!isFetching &&
                    sugestoes?.map((ref) => (
                      <button
                        key={ref.id}
                        type="button"
                        onClick={() => aplicarReferencia(ref)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800/60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-slate-200">{ref.descricao}</span>
                          <span className="text-xs text-slate-500">
                            {ref.codigo} · {ref.unidade} · {ref.uf}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-emerald-400">
                          {formatarMoeda(ref.precoMediano)}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="precoUnitario">Preço unitário (R$)</Label>
            <Input id="precoUnitario" type="number" step="0.01" {...register("precoUnitario")} />
            {errors.precoUnitario && (
              <p className="text-xs text-red-400">{errors.precoUnitario.message}</p>
            )}
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-800/40 px-3 py-2 text-sm text-slate-300">
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