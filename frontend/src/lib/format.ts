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

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formata uma data ISO para dd/mm/aaaa hh:mm; retorna "—" se ausente/ inválida. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : dateTimeFormatter.format(data);
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor (string decimal vinda da API, ou número) como BRL. */
export function formatarMoeda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const numero = typeof valor === "string" ? Number(valor) : valor;
  return Number.isNaN(numero) ? "—" : currencyFormatter.format(numero);
}