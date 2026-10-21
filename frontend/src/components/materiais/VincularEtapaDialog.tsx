// Caminho: /frontend/src/components/materiais/VincularEtapaDialog.tsx
// Modal para vincular um material a uma etapa (POST /api/etapas/:etapaId/materiais).

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

interface VincularEtapaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  obraId: string;
}

export function VincularEtapaDialog({ open, onOpenChange, material, obraId }: VincularEtapaDialogProps) {
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
    formState: { errors },
  } = useForm<VinculoFormValues>({ resolver: zodResolver(vinculoFormSchema) });

  useEffect(() => {
    if (open) {
      setErro(null);
      reset({ etapaId: "", quantidade: undefined as unknown as number, local: "" });
    }
  }, [open, reset]);

  function onSubmit(values: VinculoFormValues) {
    if (!material) return;
    setErro(null);
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
        onSuccess: () => onOpenChange(false),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular a uma etapa</DialogTitle>
          <DialogDescription>
            {material ? `Material: ${material.nome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Etapa</Label>
              <button
                type="button"
                onClick={() => setNovaEtapaOpen(true)}
                className="text-xs font-medium text-emerald-700 hover:underline"
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
            {errors.etapaId && <p className="text-xs text-red-600">{errors.etapaId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" type="number" step="0.001" {...register("quantidade")} />
              {errors.quantidade && (
                <p className="text-xs text-red-600">{errors.quantidade.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="local">Local (opcional)</Label>
              <Input id="local" {...register("local")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={criar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
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