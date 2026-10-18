// Caminho: /frontend/src/components/dashboard/KpiCard.tsx

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icon?: ReactNode;
}

export function KpiCard({ titulo, valor, descricao, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{titulo}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{valor}</div>
        {descricao && <p className="mt-1 text-xs text-slate-400">{descricao}</p>}
      </CardContent>
    </Card>
  );
}