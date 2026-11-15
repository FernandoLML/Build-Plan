// Caminho: /frontend/src/components/compras/ExportacaoCard.tsx
// Card "Exportação" da Lista de Compras: Excel (planilha de cotação editável),
// PDF (impressão/envio a fornecedores) e CSV (dados brutos, compatibilidade).

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { comprasApi } from "@/api/compras";
import { baixarArquivo, baixarBlob } from "@/lib/download";
import { nomeArquivoListaCompras } from "@/lib/slug";

type Formato = "xlsx" | "pdf" | "csv";

interface ExportacaoCardProps {
  listaId: string;
  etapaNome: string;
  onExcluir: () => void;
}

async function baixarLista(listaId: string, nomeArquivo: string, formato: Formato): Promise<void> {
  if (formato === "csv") {
    baixarArquivo(nomeArquivo, await comprasApi.exportarCsv(listaId));
    return;
  }
  const blob = formato === "xlsx" ? await comprasApi.exportarXlsx(listaId) : await comprasApi.exportarPdf(listaId);
  baixarBlob(nomeArquivo, blob);
}

export function ExportacaoCard({ listaId, etapaNome, onExcluir }: Readonly<ExportacaoCardProps>) {
  const [exportando, setExportando] = useState<Formato | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function exportar(formato: Formato) {
    setExportando(formato);
    setErro(null);
    try {
      await baixarLista(listaId, nomeArquivoListaCompras(etapaNome, formato), formato);
    } catch {
      setErro("Não foi possível exportar a lista. Tente novamente.");
    } finally {
      setExportando(null);
    }
  }

  const rotulo = (formato: Formato, padrao: string) => (exportando === formato ? "Exportando…" : padrao);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-100">Exportação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full" onClick={() => exportar("xlsx")} disabled={exportando !== null}>
          <FileSpreadsheet className="mr-1 h-4 w-4" /> {rotulo("xlsx", "Exportar Excel (.xlsx)")}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => exportar("pdf")} disabled={exportando !== null}>
          <FileText className="mr-1 h-4 w-4" /> {rotulo("pdf", "Exportar PDF")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-slate-400 hover:text-slate-100"
          onClick={() => exportar("csv")}
          disabled={exportando !== null}
        >
          <Download className="mr-1 h-4 w-4" /> {rotulo("csv", "Exportar CSV")}
        </Button>

        {erro && (
          <p role="alert" className="text-xs text-red-400">
            {erro}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Excel: planilha de cotação, com o total recalculado ao preencher os preços. PDF: pronto para imprimir ou
          enviar ao fornecedor.
        </p>

        <Button variant="ghost" className="w-full text-red-400 hover:text-red-300" onClick={onExcluir}>
          <Trash2 className="mr-1 h-4 w-4" /> Excluir lista
        </Button>
      </CardContent>
    </Card>
  );
}
