// Caminho: /frontend/src/components/cronograma/ExcluirEtapaDialog.tsx
// Confirmação da exclusão de uma etapa. Implementa a RN02 do RFC: antes de
// excluir, avisa quantos materiais vinculados ficarão sem associação.

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExcluirEtapa } from "@/hooks/useMateriais";
import { mensagemDeErro } from "@/lib/erroApi";
import type { EtapaComProgresso } from "@/types/etapa";

interface ExcluirEtapaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapa: EtapaComProgresso;
  obraId: string;
}

const plural = (n: number, singular: string, pluralizado: string) =>
  `${n} ${n === 1 ? singular : pluralizado}`;

export function ExcluirEtapaDialog({ open, onOpenChange, etapa, obraId }: Readonly<ExcluirEtapaDialogProps>) {
  const excluir = useExcluirEtapa(obraId);
  const [erro, setErro] = useState<string | null>(null);

  function handleOpenChange(aberto: boolean) {
    if (!aberto) setErro(null);
    onOpenChange(aberto);
  }

  function confirmar() {
    setErro(null);
    excluir.mutate(etapa.id, {
      onSuccess: () => handleOpenChange(false),
      onError: (e) => setErro(mensagemDeErro(e, "Não foi possível excluir a etapa.")),
    });
  }

  const vinculados = etapa.totalMateriaisVinculados;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir a etapa "{etapa.nome}"?</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>

        {vinculados > 0 && (
          <div
            role="alert"
            className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {plural(vinculados, "material vinculado a esta etapa ficará", "materiais vinculados a esta etapa ficarão")}{" "}
              sem associação. Os materiais continuam no catálogo, mas o vínculo, o status e o
              histórico de rastreabilidade nesta etapa serão apagados.
            </p>
          </div>
        )}

        {etapa.totalTarefas > 0 && (
          <p className="text-sm text-slate-400">
            {plural(etapa.totalTarefas, "tarefa desta etapa também será excluída", "tarefas desta etapa também serão excluídas")}.
          </p>
        )}

        {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={excluir.isPending}>
            {excluir.isPending ? "Excluindo…" : "Excluir etapa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
