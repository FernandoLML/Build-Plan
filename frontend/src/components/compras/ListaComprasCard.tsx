// Caminho: /frontend/src/components/compras/ListaComprasCard.tsx
// Card de uma lista de compras (por etapa): itens, totais, informar preço, export, excluir.

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { comprasApi } from "@/api/compras";
import { useExcluirItemCompra, useExcluirLista } from "@/hooks/useCompras";
import { baixarArquivo } from "@/lib/download";
import { formatarData, formatarMoeda } from "@/lib/format";
import type { ItemCompra, ListaCompras } from "@/types/compras";
import { InformarPrecoDialog } from "@/components/compras/InformarPrecoDialog";

interface ListaComprasCardProps {
  lista: ListaCompras;
  etapaNome: string;
  obraId: string;
  somenteSemPreco: boolean;
}

export function ListaComprasCard({ lista, etapaNome, obraId, somenteSemPreco }: ListaComprasCardProps) {
  const excluirLista = useExcluirLista(obraId);
  const excluirItem = useExcluirItemCompra(obraId);
  const [itemEditando, setItemEditando] = useState<ItemCompra | null>(null);
  const [exportando, setExportando] = useState(false);

  const itens = somenteSemPreco
    ? lista.itens.filter((i) => i.precoTotal === null)
    : lista.itens;

  async function exportar() {
    setExportando(true);
    try {
      const csv = await comprasApi.exportarCsv(lista.id);
      baixarArquivo(`lista-compras-${lista.id}.csv`, csv);
    } finally {
      setExportando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Etapa: {etapaNome}</CardTitle>
            <p className="text-xs text-slate-400">Gerada em {formatarData(lista.geradaEm)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportar} disabled={exportando}>
              <Download className="mr-1 h-4 w-4" /> {exportando ? "Exportando…" : "CSV"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                if (window.confirm("Excluir esta lista de compras?")) excluirLista.mutate(lista.id);
              }}
              title="Excluir lista"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span className="text-slate-500">
            Total orçado:{" "}
            <strong className="text-slate-900">{formatarMoeda(lista.totais.totalOrcado)}</strong>
          </span>
          <span className="text-slate-500">
            Itens: <strong className="text-slate-900">{lista.totais.totalItens}</strong>
          </span>
          {lista.totais.itensSemPreco > 0 && (
            <span className="text-amber-600">Sem preço: {lista.totais.itensSemPreco}</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Preço unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="text-right">
                    {item.precoUnitario ? formatarMoeda(item.precoUnitario) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.precoTotal ? formatarMoeda(item.precoTotal) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.origemPreco ?? "PENDENTE"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setItemEditando(item)}>
                        Informar preço
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => excluirItem.mutate(item.id)}
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-slate-500">
                    Nenhum item para exibir.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <InformarPrecoDialog
        open={itemEditando !== null}
        onOpenChange={(o) => !o && setItemEditando(null)}
        item={itemEditando}
        obraId={obraId}
      />
    </Card>
  );
}