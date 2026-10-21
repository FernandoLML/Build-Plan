// Caminho: /frontend/src/pages/memorial/MemorialPage.tsx
// Tela 3 — Importação do Memorial Descritivo (UC01, tabular CSV).

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { usePreviewMemorial, useImportarMemorial } from "@/hooks/useMemorial";
import { MemorialDropzone } from "@/components/memorial/MemorialDropzone";
import { TabelaMateriaisExtraidos } from "@/components/memorial/TabelaMateriaisExtraidos";

function extrairMensagem(e: unknown, padrao: string): string {
  if (e instanceof AxiosError) {
    return (e.response?.data as { message?: string })?.message ?? padrao;
  }
  return padrao;
}

export function MemorialPage() {
  const { obraAtivaId } = useObraAtiva();
  const navigate = useNavigate();
  const preview = usePreviewMemorial(obraAtivaId);
  const importar = useImportarMemorial(obraAtivaId);

  const [csv, setCsv] = useState("");
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<boolean[]>([]);

  // Ao receber a pré-visualização, marca todos os itens por padrão.
  useEffect(() => {
    if (preview.data) setSelecionados(preview.data.itens.map(() => true));
  }, [preview.data]);

  // Bloqueio amigável se não houver obra ativa.
  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
        <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 font-medium text-slate-700">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para importar o memorial.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const totalSelecionados = selecionados.filter(Boolean).length;

  function handleArquivo(texto: string, nome: string) {
    setErro(null);
    setCsv(texto);
    setArquivoNome(nome);
  }

  function processar() {
    setErro(null);
    if (!csv.trim()) {
      setErro("Cole o conteúdo CSV ou selecione um arquivo antes de processar.");
      return;
    }
    preview.mutate(csv, { onError: (e) => setErro(extrairMensagem(e, "Falha ao processar o memorial.")) });
  }

  function confirmar() {
    if (!preview.data) return;
    const itensSelecionados = preview.data.itens.filter((_, i) => selecionados[i]);
    if (itensSelecionados.length === 0) {
      setErro("Selecione ao menos um item para importar.");
      return;
    }
    importar.mutate(itensSelecionados, {
      onSuccess: () => navigate("/dashboard"),
      onError: (e) => setErro(extrairMensagem(e, "Falha ao importar os materiais.")),
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Importar Memorial</h1>
        <p className="text-sm text-slate-500">
          Importe os insumos da obra a partir de um arquivo CSV (colunas: nome, unidade, quantidade…).
        </p>
      </header>

      {erro && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {/* Entrada: arquivo + colagem de CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Envie o memorial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MemorialDropzone
            onArquivoLido={handleArquivo}
            onErro={setErro}
            disabled={preview.isPending}
          />

          {arquivoNome && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <FileText className="h-4 w-4" /> {arquivoNome}
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="csv" className="text-sm font-medium text-slate-700">
              Ou cole o conteúdo CSV
            </label>
            <textarea
              id="csv"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={5}
              placeholder={"Nome,Unidade,Quantidade\nCimento CP-II,saco,100"}
              className="w-full rounded-md border border-slate-300 p-3 font-mono text-xs outline-none focus:border-slate-500"
            />
          </div>

          <Button onClick={processar} disabled={preview.isPending}>
            {preview.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando…
              </>
            ) : (
              "Processar memorial"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Conferência + confirmação */}
      {preview.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Confira os materiais extraídos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.data.rejeitados.length > 0 && (
              <Alert>
                <AlertTitle>
                  {preview.data.rejeitados.length} linha(s) ignorada(s)
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-disc pl-5 text-xs">
                    {preview.data.rejeitados.slice(0, 5).map((r) => (
                      <li key={r.linha}>
                        Linha {r.linha}: {r.motivo}
                      </li>
                    ))}
                    {preview.data.rejeitados.length > 5 && (
                      <li>…e mais {preview.data.rejeitados.length - 5}.</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {preview.data.itens.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum item válido foi extraído. Confira o cabeçalho e o conteúdo do CSV.
              </p>
            ) : (
              <>
                <TabelaMateriaisExtraidos
                  itens={preview.data.itens}
                  selecionados={selecionados}
                  onToggle={(i) =>
                    setSelecionados((atual) =>
                      atual.map((v, idx) => (idx === i ? !v : v)),
                    )
                  }
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {totalSelecionados} de {preview.data.itens.length} selecionado(s)
                  </span>
                  <Button onClick={confirmar} disabled={importar.isPending || totalSelecionados === 0}>
                    {importar.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando…
                      </>
                    ) : (
                      `Confirmar e importar (${totalSelecionados})`
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}