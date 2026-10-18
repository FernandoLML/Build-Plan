// Caminho: /frontend/src/lib/format.ts
// Utilitários de formatação (pt-BR).

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Formata uma data ISO para dd/mm/aaaa; retorna "—" se ausente/ inválida. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : dateFormatter.format(data);
}