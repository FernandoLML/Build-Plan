// Caminho: /frontend/src/components/memorial/TabelaMateriaisExtraidos.tsx
// Tabela de conferência dos itens extraídos, com seleção por linha.

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ItemMemorial } from "@/types/memorial";

interface TabelaMateriaisExtraidosProps {
  itens: ItemMemorial[];
  selecionados: boolean[];
  onToggle: (index: number) => void;
}

export function TabelaMateriaisExtraidos({
  itens,
  selecionados,
  onToggle,
}: TabelaMateriaisExtraidosProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Especificação</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Cód. SINAPI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item, index) => (
            <TableRow key={index} data-state={selecionados[index] ? "selected" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selecionados[index] ?? false}
                  onChange={() => onToggle(index)}
                  aria-label={`Incluir ${item.nome}`}
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell className="text-slate-500">{item.especificacao ?? "—"}</TableCell>
              <TableCell>{item.unidade}</TableCell>
              <TableCell className="text-right">{item.quantidade}</TableCell>
              <TableCell className="text-slate-500">{item.codigoSinapi ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}