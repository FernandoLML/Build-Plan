// Caminho: /frontend/src/components/obras/ObraFormDialog.tsx
// Modal de criação/edição de Obra (React Hook Form + Zod + shadcn Dialog).

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
import { obraFormSchema, toObraPayload } from "@/types/obra";
import type { Obra, ObraFormValues } from "@/types/obra";
import { useAtualizarObra, useCriarObra } from "@/hooks/useObras";

interface ObraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra?: Obra | null; // null/undefined = criação
}

const VALORES_VAZIOS: ObraFormValues = { nome: "", descricao: "", endereco: "" };

export function ObraFormDialog({ open, onOpenChange, obra }: ObraFormDialogProps) {
  const criar = useCriarObra();
  const atualizar = useAtualizarObra();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObraFormValues>({
    resolver: zodResolver(obraFormSchema),
    defaultValues: VALORES_VAZIOS,
  });

  // Preenche (edição) ou limpa (criação) o formulário quando o modal abre.
  useEffect(() => {
    if (!open) return;
    setErro(null);
    reset(
      obra
        ? {
            nome: obra.nome,
            descricao: obra.descricao ?? "",
            endereco: obra.endereco ?? "",
          }
        : VALORES_VAZIOS,
    );
  }, [open, obra, reset]);

  const pendente = criar.isPending || atualizar.isPending;

  function extrairErro(e: unknown): string {
    if (e instanceof AxiosError) {
      return (e.response?.data as { message?: string })?.message ?? "Erro ao salvar a obra.";
    }
    return "Erro ao salvar a obra.";
  }

  function onSubmit(values: ObraFormValues) {
    setErro(null);
    const payload = toObraPayload(values);
    const opcoes = {
      onSuccess: () => onOpenChange(false),
      onError: (e: unknown) => setErro(extrairErro(e)),
    };

    if (obra) {
      atualizar.mutate({ id: obra.id, payload }, opcoes);
    } else {
      criar.mutate(payload, opcoes);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
          <DialogDescription>
            {obra ? "Atualize os dados da obra." : "Cadastre uma nova obra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" {...register("descricao")} />
            {errors.descricao && (
              <p className="text-xs text-red-600">{errors.descricao.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
            {errors.endereco && (
              <p className="text-xs text-red-600">{errors.endereco.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pendente}
            >
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