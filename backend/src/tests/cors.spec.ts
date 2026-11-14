// Caminho: /backend/src/tests/cors.spec.ts
// Garante que o CORS só libera as origens da allowlist (CORS_ORIGINS),
// em vez de responder "Access-Control-Allow-Origin: *" para qualquer site.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { env } from "../config/env.js";

describe("CORS", () => {
  it("libera uma origem presente na allowlist", async () => {
    const origem = env.CORS_ORIGINS[0];
    const res = await request(app).get("/api/health").set("Origin", origem);

    expect(res.headers["access-control-allow-origin"]).toBe(origem);
  });

  it("não libera uma origem fora da allowlist", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://site-malicioso.example");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("responde ao preflight apenas com os métodos e headers esperados", async () => {
    const origem = env.CORS_ORIGINS[0];
    const res = await request(app)
      .options("/api/obras")
      .set("Origin", origem)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Authorization,Content-Type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain("Authorization");
  });
});
