// Caminho: /frontend/src/components/cronograma/TarefaStatusBadge.tsx
// Badge colorido por status de tarefa (PENDENTE / EM_ANDAMENTO / CONCLUIDA / BLOQUEADA).

import { STATUS_TAREFA_CLASSES } from "@/lib/tarefas";
import { STATUS_TAREFA_LABEL, type StatusTarefa } from "@/types/tarefa";

export function TarefaStatusBadge({ status }: { status: StatusTarefa }) {
  return (
    <span
      data-status={status}
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TAREFA_CLASSES[status]}`}
    >
      {STATUS_TAREFA_LABEL[status]}
    </span>
  );
}
