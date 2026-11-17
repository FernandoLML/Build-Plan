// Caminho: /backend/src/tests/metricas.spec.ts
// Observabilidade (Etapa 6): endpoint GET /metrics e o middleware que mede as
// requisições HTTP (http_requests_total / http_request_duration_seconds).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import type { Request } from "express";
import { app } from "../app.js";
import { ROTA_NAO_MAPEADA, registroMetricas, resolverRota } from "../lib/metricas.js";
import { criarUsuarioAutenticado, criarObra } from "./helpers/auth.helper.js";

/** Valor atual do contador para um conjunto exato de labels (0 se não existir). */
async function contador(labels: Record<string, string>): Promise<number> {
  const metrica = await registroMetricas.getSingleMetric("http_requests_total")?.get();
  const amostra = metrica?.values.find((v) =>
    Object.entries(labels).every(([chave, valor]) => v.labels[chave] === valor),
  );
  return amostra?.value ?? 0;
}

describe("GET /metrics", () => {
  it("responde no formato de texto do Prometheus, sem exigir token", async () => {
    const res = await request(app).get("/metrics");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.text).toContain("# TYPE http_requests_total counter");
    expect(res.text).toContain("# TYPE http_request_duration_seconds histogram");
  });

  it("expõe as métricas padrão do Node.js (memória, CPU e event loop)", async () => {
    const res = await request(app).get("/metrics");

    expect(res.text).toContain("process_cpu_user_seconds_total");
    expect(res.text).toContain("process_resident_memory_bytes");
    expect(res.text).toContain("nodejs_heap_size_used_bytes");
    expect(res.text).toContain("nodejs_eventloop_lag_seconds");
  });

  it("não entrega as métricas a quem chega pelo proxy (X-Forwarded-For)", async () => {
    const res = await request(app).get("/metrics").set("X-Forwarded-For", "203.0.113.7");

    expect(res.status).toBe(404);
    expect(res.text).not.toContain("http_requests_total");
  });

  it("só responde ao caminho exato: variações não são atendidas", async () => {
    expect((await request(app).get("/metrics/")).status).toBe(404);
    expect((await request(app).get("/Metrics")).status).toBe(404);
    expect((await request(app).get("/api/metrics")).status).toBe(404);
  });

  it("não conta as próprias coletas do Prometheus", async () => {
    await request(app).get("/metrics");
    const res = await request(app).get("/metrics");

    expect(res.text).not.toContain('route="/metrics"');
  });
});

describe("Middleware de métricas HTTP", () => {
  it("conta a requisição com method, route e status_code", async () => {
    const labels = { method: "GET", route: "/api/health", status_code: "200" };
    const antes = await contador(labels);

    await request(app).get("/api/health");
    await request(app).get("/api/health");

    expect(await contador(labels)).toBe(antes + 2);
  });

  it("usa o padrão da rota, não a URL com o id (baixa cardinalidade)", async () => {
    const { token } = await criarUsuarioAutenticado("metricas");
    const obraId = await criarObra(token);
    const labels = { method: "GET", route: "/api/obras/:id", status_code: "200" };
    const antes = await contador(labels);

    await request(app).get(`/api/obras/${obraId}`).set("Authorization", `Bearer ${token}`);

    expect(await contador(labels)).toBe(antes + 1);
    const texto = await registroMetricas.metrics();
    expect(texto).not.toContain(obraId);
  });

  it("registra rotas aninhadas com o prefixo completo", async () => {
    const { token } = await criarUsuarioAutenticado("metricas");
    const obraId = await criarObra(token);
    const labels = { method: "GET", route: "/api/obras/:obraId/etapas", status_code: "200" };
    const antes = await contador(labels);

    await request(app).get(`/api/obras/${obraId}/etapas`).set("Authorization", `Bearer ${token}`);

    expect(await contador(labels)).toBe(antes + 1);
  });

  it("agrupa URLs inexistentes em um único label (404)", async () => {
    const labels = { method: "GET", route: ROTA_NAO_MAPEADA, status_code: "404" };
    const antes = await contador(labels);

    await request(app).get("/api/rota-que-nao-existe-1");
    await request(app).get("/api/rota-que-nao-existe-2");

    expect(await contador(labels)).toBe(antes + 2);
  });

  it("não cria um label por valor inválido de id (400 em rota aninhada)", async () => {
    const { token } = await criarUsuarioAutenticado("metricas");
    const labels = { method: "GET", route: "/api/obras/:obraId/etapas", status_code: "400" };
    const antes = await contador(labels);

    await request(app).get("/api/obras/id-invalido-1/etapas").set("Authorization", `Bearer ${token}`);
    await request(app).get("/api/obras/id-invalido-2/etapas").set("Authorization", `Bearer ${token}`);

    expect(await contador(labels)).toBe(antes + 2);
    expect(await registroMetricas.metrics()).not.toContain("id-invalido");
  });

  it("registra erros de autenticação e de validação com o status devolvido", async () => {
    const semToken = { method: "GET", route: ROTA_NAO_MAPEADA, status_code: "401" };
    const invalido = { method: "POST", route: "/api/auth/login", status_code: "400" };
    const antesSemToken = await contador(semToken);
    const antesInvalido = await contador(invalido);

    await request(app).get("/api/obras");
    await request(app).post("/api/auth/login").send({ email: "nao-eh-email" });

    expect(await contador(semToken)).toBe(antesSemToken + 1);
    expect(await contador(invalido)).toBe(antesInvalido + 1);
  });

  it("observa a duração no histograma", async () => {
    await request(app).get("/api/health");
    const res = await request(app).get("/metrics");

    expect(res.text).toMatch(
      /http_request_duration_seconds_bucket\{le="0\.005",method="GET",route="\/api\/health",status_code="200"\} \d+/,
    );
    expect(res.text).toMatch(
      /http_request_duration_seconds_count\{method="GET",route="\/api\/health",status_code="200"\} \d+/,
    );
  });
});

describe("resolverRota", () => {
  const requisicao = (dados: Record<string, unknown>) =>
    ({ baseUrl: "", params: {}, ...dados }) as unknown as Request;

  it("junta o prefixo do router com o padrão da rota", () => {
    const req = requisicao({ baseUrl: "/api/tarefas", route: { path: "/:id" }, params: { id: "42" } });
    expect(resolverRota(req)).toBe("/api/tarefas/:id");
  });

  it("troca pelo nome do parâmetro os valores que aparecem no prefixo", () => {
    const req = requisicao({
      baseUrl: "/api/obras/valor%20qualquer/etapas",
      route: { path: "/" },
      params: { obraId: "valor qualquer" },
    });
    expect(resolverRota(req)).toBe("/api/obras/:obraId/etapas");
  });

  it("tolera segmento com codificação inválida no prefixo", () => {
    const req = requisicao({ baseUrl: "/api/%E0%A4%A", route: { path: "/x" } });
    expect(resolverRota(req)).toBe("/api/%E0%A4%A/x");
  });

  it("mantém a raiz como '/'", () => {
    expect(resolverRota(requisicao({ route: { path: "/" } }))).toBe("/");
  });

  it("devolve o label genérico quando nenhuma rota casou", () => {
    expect(resolverRota(requisicao({ route: undefined }))).toBe(ROTA_NAO_MAPEADA);
  });

  it("devolve o label genérico para rotas declaradas com regex ou lista", () => {
    expect(resolverRota(requisicao({ baseUrl: "/api", route: { path: /x/ } }))).toBe(
      ROTA_NAO_MAPEADA,
    );
  });
});
