// Caminho: /frontend/src/lib/erroApi.ts
// Extrai a mensagem de erro devolvida pela API ({ message }) de um erro do Axios.

import { AxiosError } from "axios";

export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof AxiosError) {
    const mensagem = (erro.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof mensagem === "string" && mensagem.length > 0) return mensagem;
  }
  return padrao;
}
