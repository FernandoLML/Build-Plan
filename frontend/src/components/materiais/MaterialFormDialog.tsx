// Caminho: /frontend/src/components/materiais/MaterialFormDialog.tsx
// Modal de criação/edição de material (nome, especificação, unidade, quantidade).

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
import { useAtualizarMaterial, useCriarMaterial } from "@/hooks/useMateriais";

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null; // null = criação
  obraId: string;
}

const VAZIO: MaterialFormValues = { nome: "", especificacao: "", unidade: "", quantidade: 0 };

export function MaterialFormDialog({ open, onOpenChange, material, obraId }: MaterialFormDialogProps) {
  const criar = useCriarMaterial(obraId);
  const atualizar = useAtualizarMaterial(obraId);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialFormValues>({ resolver: zodResolver(materialFormSchema) });

  useEffect(() => {
    if (!open) return;
    setErro(null);
    reset(
      material
        ? {
            nome: material.nome,
            especificacao: material.especificacao ?? "",
            unidade: material.unidade,
            quantidade: Number(material.quantidade),
          }
        : VAZIO,
    );
  }, [open, material, reset]);

  const pendente = criar.isPending || atualizar.isPending;

  function tratarErro(e: unknown) {
    setErro(
      e instanceof AxiosError
        ? (e.response?.data as { message?: string })?.message ?? "Erro ao salvar."
        : "Erro ao salvar.",
    );
  }

  function onSubmit(values: MaterialFormValues) {
    setErro(null);
    const payload = {
      nome: values.nome,
      especificacao: values.especificacao ? values.especificacao : undefined,
      unidade: values.unidade,
      quantidade: values.quantidade,
    };
    const opcoes = {
      onSuccess: () => onOpenChange(false),
      onError: tratarErro,
    };

    if (material) {
      atualizar.mutate({ id: material.id, payload }, opcoes);
    } else {
      criar.mutate(payload, opcoes);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? "Editar material" : "Novo material"}</DialogTitle>
          <DialogDescription>
            {material ? "Atualize os dados do insumo." : "Cadastre um novo insumo no catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-slate-300">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-xs text-red-400">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="especificacao" className="text-slate-300">Especificação</Label>
            <Input id="especificacao" {...register("especificacao")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unidade" className="text-slate-300">Unidade</Label>
              <Input id="unidade" placeholder="kg, m³, un…" {...register("unidade")} />
              {errors.unidade && <p className="text-xs text-red-400">{errors.unidade.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantidade" className="text-slate-300">Quantidade</Label>
              <Input id="quantidade" type="number" step="0.001" {...register("quantidade")} />
              {errors.quantidade && <p className="text-xs text-red-400">{errors.quantidade.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pendente}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}