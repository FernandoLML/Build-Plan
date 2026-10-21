// Caminho: /frontend/src/components/dashboard/BarraProgresso.tsx
// Barra de progresso simples (sem dependência de plugin de animação).

interface BarraProgressoProps {
  label: string;
  percentual: number; // 0–100
  detalhe?: string;
  cor?: string; // classe Tailwind de bg (ex.: "bg-emerald-500")
}

export function BarraProgresso({
  label,
  percentual,
  detalhe,
  cor = "bg-emerald-500",
}: BarraProgressoProps) {
  const largura = Math.min(100, Math.max(0, percentual));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{detalhe ?? `${percentual}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${cor}`} style={{ width: `${largura}%` }} />
      </div>
    </div>
  );
}