// Caminho: /backend/src/middlewares/rate-limit.middleware.ts
// Limitadores de requisições por IP (express-rate-limit, contadores em memória —
// adequado a uma única instância da API). O IP vem de req.ip, que atrás do
// Nginx depende de `trust proxy` (ver app.ts / TRUST_PROXY).
//
//  - geral:    teto por IP para toda a /api (abuso, scraping, loops de cliente).
//  - login:    conta só as tentativas que FALHARAM (força bruta de senha).
//  - cadastro: conta todos os cadastros (criação de contas em massa).

import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";

const MINUTO = 60 * 1000;

export interface LimitesRateLimit {
  geral: { janelaMs: number; max: number };
  login: { janelaMs: number; max: number };
  cadastro: { janelaMs: number; max: number };
}

export const LIMITES_PADRAO: LimitesRateLimit = {
  geral: { janelaMs: MINUTO, max: 300 },
  login: { janelaMs: 15 * MINUTO, max: 10 },
  cadastro: { janelaMs: 60 * MINUTO, max: 10 },
};

export interface LimitadoresApi {
  geral: RateLimitRequestHandler;
  login: RateLimitRequestHandler;
  cadastro: RateLimitRequestHandler;
}

function criarLimitador(
  janelaMs: number,
  max: number,
  mensagem: string,
  extras: { skipSuccessfulRequests?: boolean; ignorar?: (caminho: string) => boolean } = {},
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: janelaMs,
    limit: max,
    standardHeaders: "draft-7", // RateLimit / RateLimit-Policy + Retry-After no 429
    legacyHeaders: false,
    skipSuccessfulRequests: extras.skipSuccessfulRequests ?? false,
    skip: (req) => extras.ignorar?.(req.path) ?? false,
    // Mesmo formato dos demais erros da API ({ message }).
    message: { message: mensagem },
  });
}

/** Cria um conjunto NOVO de limitadores (contadores zerados). */
export function criarLimitadores(limites: LimitesRateLimit = LIMITES_PADRAO): LimitadoresApi {
  return {
    geral: criarLimitador(
      limites.geral.janelaMs,
      limites.geral.max,
      "Muitas requisições. Aguarde um instante e tente novamente.",
      // O health-check (monitoramento/Nginx) não consome a cota.
      { ignorar: (caminho) => caminho === "/health" },
    ),
    login: criarLimitador(
      limites.login.janelaMs,
      limites.login.max,
      "Muitas tentativas de login. Tente novamente em alguns minutos.",
      { skipSuccessfulRequests: true },
    ),
    cadastro: criarLimitador(
      limites.cadastro.janelaMs,
      limites.cadastro.max,
      "Muitos cadastros a partir deste endereço. Tente novamente mais tarde.",
    ),
  };
}
