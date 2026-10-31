// Caminho: /frontend/src/components/dashboard/BarraProgresso.tsx
// Barra de progresso fina (Obsidian Precision): trilho slate-800 + barra colorida.

interface BarraProgressoProps {
  label: string;
  percentual: number; // 0–100
  detalhe?: string;
  cor?: string; // classe Tailwind de bg (ex.: "bg-indigo-600")
}

export function BarraProgresso({
  label,
  percentual,
  detalhe,
  cor = "bg-indigo-600",
}: BarraProgressoProps) {
  const largura = Math.min(100, Math.max(0, percentual));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">{detalhe ?? `${percentual}%`}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${largura}%` }} />
      </div>
    </div>
  );
}