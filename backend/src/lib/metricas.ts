// Caminho: /backend/src/lib/metricas.ts
// Métricas da API no formato do Prometheus (prom-client).
//  - métricas padrão do Node.js (memória, CPU, event loop, GC), com o prefixo
//    padrão do prom-client (process_* e nodejs_*);
//  - http_requests_total: contador de requisições;
//  - http_request_duration_seconds: histograma de duração.
// As duas métricas HTTP têm os labels method, route e status_code.
//
// O registro é único por processo: createApp() pode ser chamado várias vezes
// (testes), mas as métricas padrão só podem ser registradas uma vez.

import { Router, type Request, type RequestHandler, type Response } from "express";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const CAMINHO_METRICAS = "/metrics";

/**
 * Label usado quando a requisição não chegou a um handler de rota: URL
 * inexistente (404) ou recusa anterior ao roteamento, como token ausente
 * (401). Evita criar um label por URL digitada.
 */
export const ROTA_NAO_MAPEADA = "nao_mapeada";

export const registroMetricas = new Registry();

collectDefaultMetrics({ register: registroMetricas });

const requisicoesTotal = new Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP atendidas pela API.",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [registroMetricas],
});

const duracaoRequisicoes = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP, em segundos.",
  labelNames: ["method", "route", "status_code"] as const,
  // De 5 ms a 5 s: cobre de leituras simples até exportações e importações.
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registroMetricas],
});

const CHAVE_ROTA = "rotaMetrica";

function decodificar(segmento: string): string {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return segmento;
  }
}

/**
 * Rota no formato declarado no Express ("/api/obras/:obraId/etapas"), e não a
 * URL real ("/api/obras/3f2a…/etapas"). Usar a URL criaria uma série temporal
 * por id, o que faz a memória do Prometheus crescer sem limite (alta
 * cardinalidade).
 *
 * `req.route.path` já vem como padrão ("/:id"), mas `req.baseUrl` (o prefixo
 * dos routers aninhados) vem com os valores reais. Como os routers usam
 * `mergeParams`, `req.params` tem todos os parâmetros do caminho: cada
 * segmento do prefixo que for o valor de um parâmetro é trocado pelo nome.
 */
export function resolverRota(req: Request): string {
  const caminho: unknown = req.route?.path;
  if (typeof caminho !== "string") return ROTA_NAO_MAPEADA;

  const nomePorValor = new Map(Object.entries(req.params).map(([nome, valor]) => [valor, nome]));
  const prefixo = req.baseUrl
    .split("/")
    .map((segmento) => {
      const nome = nomePorValor.get(decodificar(segmento));
      return nome === undefined ? segmento : `:${nome}`;
    })
    .join("/");

  const rota = `${prefixo}${caminho}`;
  return rota.length > 1 && rota.endsWith("/") ? rota.slice(0, -1) : rota;
}

/**
 * Guarda a rota resolvida assim que o handler começa (chamado pelo
 * asyncHandler). Precisa ser nesse momento: quando o handler falha, o Express
 * restaura `req.baseUrl` ao repassar o erro e o prefixo se perde.
 */
export function marcarRota(req: Request, res: Response): void {
  res.locals[CHAVE_ROTA] = resolverRota(req);
}

/** Mede cada requisição ao terminar a resposta. O próprio /metrics não entra. */
export const metricasMiddleware: RequestHandler = (req, res, next) => {
  if (req.path === CAMINHO_METRICAS) {
    next();
    return;
  }

  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    const segundos = Number(process.hrtime.bigint() - inicio) / 1e9;
    const labels = {
      method: req.method,
      route: typeof res.locals[CHAVE_ROTA] === "string" ? res.locals[CHAVE_ROTA] : resolverRota(req),
      status_code: String(res.statusCode),
    };
    requisicoesTotal.inc(labels);
    duracaoRequisicoes.observe(labels, segundos);
  });
  next();
};

/**
 * A requisição passou pelo Nginx? O bloco "location /" do Nginx sempre envia
 * X-Forwarded-For; o Prometheus, que fala direto com a API pela rede interna
 * do Docker, não envia. É uma segunda barreira: mesmo que a regra do Nginx
 * para /metrics seja removida por engano, a API não entrega as métricas a
 * quem vem de fora.
 */
function veioPeloProxy(req: Request): boolean {
  return req.headers["x-forwarded-for"] !== undefined;
}

async function responderMetricas(req: Request, res: Response): Promise<void> {
  if (veioPeloProxy(req)) {
    res.status(404).json({ message: "Recurso não encontrado." });
    return;
  }
  res.setHeader("Content-Type", registroMetricas.contentType);
  res.setHeader("Cache-Control", "no-store");
  res.send(await registroMetricas.metrics());
}

/**
 * Router de GET /metrics. `strict` e `caseSensitive` fazem a API responder
 * apenas ao caminho exato: sem eles o Express também aceitaria "/metrics/" e
 * "/Metrics", que escapariam de uma regra de bloqueio escrita só para
 * "/metrics" no proxy.
 */
export function criarMetricasRouter(): Router {
  const router = Router({ strict: true, caseSensitive: true });
  router.get(CAMINHO_METRICAS, (req, res, next) => {
    responderMetricas(req, res).catch(next);
  });
  return router;
}
