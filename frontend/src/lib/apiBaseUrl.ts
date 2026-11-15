// Caminho: /frontend/src/lib/apiBaseUrl.ts
// Resolve a URL base da API a partir de VITE_API_URL (definida no build).
//  - Desenvolvimento: sem a variável, usa a API local.
//  - Produção (Vercel): a variável é obrigatória e precisa ser https://, pois o
//    navegador bloqueia chamadas http:// feitas por uma página https (mixed
//    content). O `vite build` na Vercel já falha sem ela (ver vite.config.ts).

export const API_LOCAL = "http://localhost:3333/api";

interface EnvApi {
  VITE_API_URL?: string;
  PROD?: boolean;
}

function semBarrasFinais(url: string): string {
  let fim = url.length;
  while (fim > 0 && url[fim - 1] === "/") fim--;
  return url.slice(0, fim);
}

export function resolverApiBaseUrl(env: EnvApi): string {
  const informada = semBarrasFinais(env.VITE_API_URL?.trim() ?? "");

  if (!informada) {
    if (env.PROD) {
      console.error("[api] VITE_API_URL não foi definida no build de produção; usando a API local.");
    }
    return API_LOCAL;
  }
  if (env.PROD && !informada.startsWith("https://")) {
    console.error("[api] VITE_API_URL deve usar https:// em produção (mixed content).");
  }
  return informada;
}
