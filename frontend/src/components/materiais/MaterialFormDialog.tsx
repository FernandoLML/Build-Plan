// Caminho: /frontend/src/components/materiais/MaterialFormDialog.tsx
// Modal de edição rápida de material (nome, especificação, unidade, quantidade).

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
import { materialFormSchema } from "@/types/material";
import type { Material, MaterialFormValues } from "@/types/material";
import { useAtualizarMaterial } from "@/hooks/useMateriais";

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  obraId: string;
}

export function MaterialFormDialog({ open, onOpenChange, material, obraId }: MaterialFormDialogProps) {
  const atualizar = useAtualizarMaterial(obraId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialFormValues>({ resolver: zodResolver(materialFormSchema) });

  useEffect(() => {
    if (open && material) {
      setErro(null);
      reset({
        nome: material.nome,
        especificacao: material.especificacao ?? "",
        unidade: material.unidade,
        quantidade: Number(material.quantidade),
      });
    }
  }, [open, material, reset]);

  function onSubmit(values: MaterialFormValues) {
    if (!material) return;
    setErro(null);
    atualizar.mutate(
      {
        id: material.id,
        payload: {
          nome: values.nome,
          especificacao: values.especificacao ? values.especificacao : undefined,
          unidade: values.unidade,
          quantidade: values.quantidade,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof AxiosError
              ? (e.response?.data as { message?: string })?.message ?? "Erro ao salvar."
              : "Erro ao salvar.",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar material</DialogTitle>
          <DialogDescription>Atualize os dados do insumo no catálogo.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="especificacao">Especificação</Label>
            <Input id="especificacao" {...register("especificacao")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="unidade">Unidade</Label>
              <Input id="unidade" {...register("unidade")} />
              {errors.unidade && <p className="text-xs text-red-600">{errors.unidade.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" type="number" step="0.001" {...register("quantidade")} />
              {errors.quantidade && (
                <p className="text-xs text-red-600">{errors.quantidade.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={atualizar.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizar.isPending}>
              {atualizar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}