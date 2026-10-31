// Caminho: /frontend/src/pages/materiais/MateriaisPage.tsx
// Tela 4 — Catálogo & Vínculos (RFC 4.4). Barra superior + filtros + master-detail.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import {
  useMateriais,
  useExcluirMaterial,
  useEtapas,
  useVinculosDaObra,
} from "@/hooks/useMateriais";
import { MaterialFormDialog } from "@/components/materiais/MaterialFormDialog";
import { VincularEtapaDialog } from "@/components/materiais/VincularEtapaDialog";
import { MaterialDetailPanel } from "@/components/materiais/MaterialDetailPanel";
import type { VinculoResumo } from "@/components/materiais/MaterialDetailPanel";
import type { Material } from "@/types/material";

const TH = "text-xs font-semibold uppercase tracking-wider text-slate-400";

export function MateriaisPage() {
  const { obraAtivaId } = useObraAtiva();

  const [formOpen, setFormOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState<Material | null>(null); // null = criar
  const [vinculando, setVinculando] = useState<Material | null>(null);
  const [selecionado, setSelecionado] = useState<Material | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [filtroOrigem, setFiltroOrigem] = useState("todas");

  const materiais = useMateriais(obraAtivaId);
  const excluir = useExcluirMaterial(obraAtivaId);
  const { data: etapas } = useEtapas(obraAtivaId);
  const { vinculos, isLoading: carregandoVinculos } = useVinculosDaObra(obraAtivaId);

  const nomeEtapa = (etapaId: string): string =>
    etapas?.find((e) => e.id === etapaId)?.nome ?? "Etapa";

  const materiaisFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (materiais.data ?? []).filter((m) => {
      const matchBusca =
        !q ||
        m.nome.toLowerCase().includes(q) ||
        (m.codigoSinapi ?? "").toLowerCase().includes(q) ||
        (m.especificacao ?? "").toLowerCase().includes(q);
      const matchOrigem = filtroOrigem === "todas" || m.origem === filtroOrigem;
      const matchEtapa =
        filtroEtapa === "todas" ||
        vinculos.some((v) => v.etapaId === filtroEtapa && v.materialId === m.id);
      return matchBusca && matchOrigem && matchEtapa;
    });
  }, [materiais.data, busca, filtroOrigem, filtroEtapa, vinculos]);

  const vinculosSelecionado: VinculoResumo[] = useMemo(() => {
    if (!selecionado) return [];
    return vinculos
      .filter((v) => v.materialId === selecionado.id)
      .map((v) => ({ id: v.id, etapaNome: nomeEtapa(v.etapaId), quantidade: v.quantidade }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado, vinculos, etapas]);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 font-medium text-slate-200">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para ver o catálogo de materiais.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  function abrirCriacao() {
    setMaterialForm(null);
    setFormOpen(true);
  }

  function handleExcluir(material: Material) {
    if (window.confirm(`Excluir o material "${material.nome}"?`)) {
      excluir.mutate(material.id);
      if (selecionado?.id === material.id) setSelecionado(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra superior: título + ação primária */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">
            Catálogo de Insumos
          </h1>
          <p className="text-sm text-slate-400">
            Gestão central de insumos e alocação por etapa construtiva.
          </p>
        </div>
        <Button onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Novo material
        </Button>
      </header>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código ou especificação…"
            className="pl-9"
          />
        </div>
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            {etapas?.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas as origens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as origens</SelectItem>
            <SelectItem value="MEMORIAL">Memorial</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {materiais.isLoading && (
        <div className="flex items-center gap-2 py-10 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando materiais…
        </div>
      )}

      {materiais.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">Não foi possível carregar os materiais.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => materiais.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!materiais.isLoading && !materiais.isError && materiais.data && materiais.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 font-medium text-slate-200">Catálogo vazio</p>
          <p className="text-sm text-slate-500">Importe o memorial ou cadastre um material para começar.</p>
          <Button className="mt-4" onClick={abrirCriacao}>
            <Plus className="mr-1 h-4 w-4" /> Novo material
          </Button>
        </div>
      )}

      {/* Master-detail */}
      {!materiais.isLoading && !materiais.isError && materiais.data && materiais.data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={TH}>Material</TableHead>
                  <TableHead className={TH}>Unidade</TableHead>
                  <TableHead className={`${TH} text-right`}>Quantidade</TableHead>
                  <TableHead className={TH}>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiaisFiltrados.map((material) => {
                  const ativo = selecionado?.id === material.id;
                  return (
                    <TableRow
                      key={material.id}
                      onClick={() => setSelecionado(material)}
                      className={`cursor-pointer border-l-2 ${
                        ativo
                          ? "border-l-indigo-500 bg-indigo-600/10"
                          : "border-l-transparent hover:bg-slate-800/30"
                      }`}
                    >
                      <TableCell className="font-medium text-slate-100">
                        {material.nome}
                        {material.codigoSinapi && (
                          <span className="ml-2 text-xs text-slate-500">· {material.codigoSinapi}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400">{material.unidade}</TableCell>
                      <TableCell className="text-right text-slate-200">{material.quantidade}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {material.origem === "MEMORIAL" ? "Memorial" : "Manual"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {materiaisFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-slate-500">
                      Nenhum material corresponde aos filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <MaterialDetailPanel
              material={selecionado}
              vinculos={vinculosSelecionado}
              carregandoVinculos={carregandoVinculos}
              onVincular={setVinculando}
              onEditar={(m) => {
                setMaterialForm(m);
                setFormOpen(true);
              }}
              onExcluir={handleExcluir}
            />
          </div>
        </div>
      )}

      <MaterialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        material={materialForm}
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