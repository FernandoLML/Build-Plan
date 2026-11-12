// Caminho: /frontend/src/components/cronograma/TarefaFormDialog.tsx
// Modal de criação/edição de tarefa (POST /etapas/:etapaId/tarefas | PUT /tarefas/:id).

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
import { useAtualizarTarefa, useCriarTarefa } from "@/hooks/useTarefas";
import { isoParaDataInput, montarPayloadEdicaoTarefa, montarPayloadTarefa } from "@/lib/tarefas";
import {
  STATUS_TAREFA,
  STATUS_TAREFA_LABEL,
  tarefaFormSchema,
  type Tarefa,
  type TarefaFormValues,
} from "@/types/tarefa";

const CAMPO =
  "flex w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50";

interface TarefaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapaId: string;
  obraId: string;
  tarefa?: Tarefa | null; // presente = edição
}

function mensagemErro(e: unknown, padrao: string): string {
  if (e instanceof AxiosError) {
    return (e.response?.data as { message?: string } | undefined)?.message ?? padrao;
  }
  return padrao;
}

function valoresIniciais(tarefa?: Tarefa | null): TarefaFormValues {
  return {
    titulo: tarefa?.titulo ?? "",
    descricao: tarefa?.descricao ?? "",
    status: tarefa?.status ?? "PENDENTE",
    dataInicioPrev: isoParaDataInput(tarefa?.dataInicioPrev),
    dataFimPrev: isoParaDataInput(tarefa?.dataFimPrev),
  };
}

export function TarefaFormDialog({ open, onOpenChange, etapaId, obraId, tarefa }: TarefaFormDialogProps) {
  const editando = !!tarefa;
  const criar = useCriarTarefa(etapaId, obraId);
  const atualizar = useAtualizarTarefa(etapaId, obraId);
  const pendente = criar.isPending || atualizar.isPending;
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TarefaFormValues>({
    resolver: zodResolver(tarefaFormSchema),
    defaultValues: valoresIniciais(tarefa),
  });

  // Sincroniza o formulário (estado externo do react-hook-form) ao abrir.
  useEffect(() => {
    if (open) reset(valoresIniciais(tarefa));
  }, [open, tarefa, reset]);

  function handleOpenChange(aberto: boolean) {
    if (!aberto) setErro(null);
    onOpenChange(aberto);
  }

  function onSubmit(values: TarefaFormValues) {
    setErro(null);
    const opcoes = {
      onSuccess: () => handleOpenChange(false),
      onError: (e: unknown) =>
        setErro(mensagemErro(e, editando ? "Erro ao salvar tarefa." : "Erro ao criar tarefa.")),
    };
    if (tarefa) {
      atualizar.mutate({ id: tarefa.id, payload: montarPayloadEdicaoTarefa(values) }, opcoes);
    } else {
      criar.mutate(montarPayloadTarefa(values), opcoes);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {erro && (
            <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {erro}
            </p>
          )}

          <div className="space-y-1">
            <Label htmlFor="tarefa-titulo">Título</Label>
            <Input id="tarefa-titulo" placeholder="Ex.: Escavação das sapatas" {...register("titulo")} />
            {errors.titulo && <p className="text-xs text-red-400">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tarefa-descricao">Descrição (opcional)</Label>
            <textarea
              id="tarefa-descricao"
              rows={3}
              className={`${CAMPO} py-2`}
              {...register("descricao")}
            />
            {errors.descricao && <p className="text-xs text-red-400">{errors.descricao.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tarefa-status">Status</Label>
            <select id="tarefa-status" className={`${CAMPO} h-9`} {...register("status")}>
              {STATUS_TAREFA.map((s) => (
                <option key={s} value={s}>
                  {STATUS_TAREFA_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tarefa-inicio">Início previsto</Label>
              <Input id="tarefa-inicio" type="date" {...register("dataInicioPrev")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tarefa-fim">Término previsto</Label>
              <Input id="tarefa-fim" type="date" {...register("dataFimPrev")} />
            </div>
          </div>
          {errors.dataFimPrev && <p className="text-xs text-red-400">{errors.dataFimPrev.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pendente}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : editando ? "Salvar alterações" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
