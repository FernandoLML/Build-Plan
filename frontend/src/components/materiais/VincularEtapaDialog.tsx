// Caminho: /frontend/src/components/materiais/VincularEtapaDialog.tsx
// Modal para vincular um material a uma etapa (POST /api/etapas/:etapaId/materiais).
// Mostra o saldo do material e não deixa vincular mais do que ele tem no
// catálogo (a API aplica a mesma regra).

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vinculoFormSchema } from "@/types/material";
import type { Material, VinculoFormValues } from "@/types/material";
import { useCriarVinculo, useEtapas } from "@/hooks/useMateriais";
import { EtapaFormDialog } from "@/components/materiais/EtapaFormDialog";
import { formatarQuantidade } from "@/lib/format";
import type { SaldoMaterial } from "@/lib/suprimentos";

interface VincularEtapaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  obraId: string;
  /** Saldo do material (catálogo − já vinculado); null enquanto os vínculos carregam. */
  saldo: SaldoMaterial | null;
}

export function VincularEtapaDialog({ open, onOpenChange, material, obraId, saldo }: Readonly<VincularEtapaDialogProps>) {
  const { data: etapas } = useEtapas(obraId);
  const criar = useCriarVinculo(obraId);
  const [erro, setErro] = useState<string | null>(null);
  const [novaEtapaOpen, setNovaEtapaOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<VinculoFormValues>({ resolver: zodResolver(vinculoFormSchema) });

  useEffect(() => {
    if (open) {
      reset({ etapaId: "", quantidade: undefined as unknown as number, local: "" });
    }
  }, [open, reset]);

  // Estado local é limpo ao FECHAR (não num effect ao abrir): evita setState
  // síncrono dentro de useEffect (react-hooks/set-state-in-effect).
  function handleOpenChange(aberto: boolean) {
    if (!aberto) {
      setErro(null);
    }
    onOpenChange(aberto);
  }

  const unidade = material?.unidade ?? "";
  const semSaldo = saldo !== null && saldo.disponivel <= 0;

  function onSubmit(values: VinculoFormValues) {
    if (!material) return;
    setErro(null);
    if (saldo && values.quantidade > saldo.disponivel) {
      setError("quantidade", {
        message: `Máximo disponível: ${formatarQuantidade(saldo.disponivel)} ${unidade}.`,
      });
      return;
    }
    criar.mutate(
      {
        etapaId: values.etapaId,
        payload: {
          materialId: material.id,
          quantidade: values.quantidade,
          local: values.local ? values.local : undefined,
        },
      },
      {
        onSuccess: () => handleOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ?? "Erro ao vincular."
              : "Erro ao vincular.",
          ),
      },
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular a uma etapa</DialogTitle>
          <DialogDescription>
            {material ? `Material: ${material.nome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>}

          {saldo && (
            <div
              data-testid="saldo-material"
              className={`rounded-md border px-3 py-2 text-sm ${
                semSaldo
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-slate-800 bg-slate-950 text-slate-300"
              }`}
            >
              <p>
                Disponível para vincular:{" "}
                <span className="font-semibold tabular-nums">
                  {formatarQuantidade(saldo.disponivel)} {unidade}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Catálogo: {formatarQuantidade(saldo.total)} {unidade} · já vinculado:{" "}
                {formatarQuantidade(saldo.vinculado)} {unidade}
              </p>
              {semSaldo && (
                <p className="mt-1 text-xs">
                  Todo o material já está vinculado. Aumente a quantidade no catálogo ou reduza outro vínculo.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Etapa</Label>
              <button
                type="button"
                onClick={() => setNovaEtapaOpen(true)}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                + Nova etapa
              </button>
            </div>
            <Controller
              control={control}
              name="etapaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
            {errors.etapaId && <p className="text-xs text-red-400">{errors.etapaId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" type="number" step="0.001" {...register("quantidade")} />
              {errors.quantidade && (
                <p className="text-xs text-red-400">{errors.quantidade.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="local">Local (opcional)</Label>
              <Input id="local" {...register("local")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={criar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending || semSaldo}>
              {criar.isPending ? "Vinculando…" : "Vincular"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <EtapaFormDialog
        open={novaEtapaOpen}
        onOpenChange={setNovaEtapaOpen}
        obraId={obraId}
        onCriada={(id) => setValue("etapaId", id, { shouldValidate: true })}
      />
    </>
  );
}