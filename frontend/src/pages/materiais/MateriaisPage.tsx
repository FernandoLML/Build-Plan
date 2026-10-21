// Caminho: /frontend/src/pages/materiais/MateriaisPage.tsx
// Tela 4 — Catálogo de Materiais e Vínculos (RFC 4.4). Abas: Catálogo / Vínculos.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Link2, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useMateriais, useExcluirMaterial } from "@/hooks/useMateriais";
import { MaterialFormDialog } from "@/components/materiais/MaterialFormDialog";
import { VincularEtapaDialog } from "@/components/materiais/VincularEtapaDialog";
import { VinculosEtapaPanel } from "@/components/materiais/VinculosEtapaPanel";
import type { Material } from "@/types/material";

export function MateriaisPage() {
  const { obraAtivaId } = useObraAtiva();

  const [editando, setEditando] = useState<Material | null>(null);
  const [vinculando, setVinculando] = useState<Material | null>(null);

  const materiais = useMateriais(obraAtivaId);
  const excluir = useExcluirMaterial(obraAtivaId);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 font-medium text-slate-700">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para ver o catálogo de materiais.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  function handleExcluir(material: Material) {
    if (window.confirm(`Excluir o material "${material.nome}"?`)) {
      excluir.mutate(material.id);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Catálogo e Vínculos</h1>
        <p className="text-sm text-slate-500">
          Gerencie os insumos da obra e associe-os às etapas de execução.
        </p>
      </header>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos por etapa</TabsTrigger>
        </TabsList>

        {/* ---- Catálogo ---- */}
        <TabsContent value="catalogo" className="mt-4">
          {materiais.isLoading && (
            <div className="flex items-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Carregando materiais…
            </div>
          )}

          {materiais.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">Não foi possível carregar os materiais.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => materiais.refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!materiais.isLoading && !materiais.isError && materiais.data && materiais.data.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 font-medium text-slate-700">Catálogo vazio</p>
              <p className="text-sm text-slate-500">
                Importe o memorial ou cadastre materiais para começar.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/memorial">Importar memorial</Link>
              </Button>
            </div>
          )}

          {!materiais.isLoading && !materiais.isError && materiais.data && materiais.data.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Especificação</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiais.data.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.nome}</TableCell>
                      <TableCell className="text-slate-500">{material.especificacao ?? "—"}</TableCell>
                      <TableCell>{material.unidade}</TableCell>
                      <TableCell className="text-right">{material.quantidade}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {material.origem === "MEMORIAL" ? "Memorial" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setVinculando(material)}>
                            <Link2 className="mr-1 h-4 w-4" /> Vincular
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditando(material)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleExcluir(material)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ---- Vínculos ---- */}
        <TabsContent value="vinculos" className="mt-4">
          <VinculosEtapaPanel obraId={obraAtivaId} />
        </TabsContent>
      </Tabs>

      <MaterialFormDialog
        open={editando !== null}
        onOpenChange={(o) => !o && setEditando(null)}
        material={editando}
        obraId={obraAtivaId}
      />
      <VincularEtapaDialog
        open={vinculando !== null}
        onOpenChange={(o) => !o && setVinculando(null)}
        material={vinculando}
        obraId={obraAtivaId}
      />
    </div>
  );
}