// Caminho: /frontend/src/components/obras/ObraCard.tsx
// Card de uma obra na listagem (Tela 1).

import { CheckCircle2, MapPin, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/format";
import type { Obra } from "@/types/obra";

interface ObraCardProps {
  obra: Obra;
  ativa: boolean;
  onSelecionar: (obra: Obra) => void;
  onEditar: (obra: Obra) => void;
  onExcluir: (obra: Obra) => void;
}

export function ObraCard({ obra, ativa, onSelecionar, onEditar, onExcluir }: ObraCardProps) {
  return (
    <Card className={ativa ? "border-emerald-500 ring-1 ring-emerald-500" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{obra.nome}</CardTitle>
          {ativa && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
            </span>
          )}
        </div>
        <CardDescription>{obra.descricao || "Sem descrição."}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1 text-sm text-slate-600">
        {obra.endereco && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" /> {obra.endereco}
          </p>
        )}
        <p className="text-xs text-slate-400">Criada em {formatarData(obra.createdAt)}</p>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={ativa ? "secondary" : "default"}
          onClick={() => onSelecionar(obra)}
          disabled={ativa}
        >
          {ativa ? "Selecionada" : "Selecionar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEditar(obra)}>
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:text-red-700"
          onClick={() => onExcluir(obra)}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}