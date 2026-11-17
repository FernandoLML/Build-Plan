// Caminho: /frontend/src/lib/erroApi.test.ts

import { describe, it, expect } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { mensagemDeErro } from "./erroApi";

function erroComCorpo(data: unknown): AxiosError {
  const resposta = { status: 400, data } as AxiosResponse;
  return new AxiosError("falhou", "ERR_BAD_REQUEST", undefined, undefined, resposta);
}

describe("mensagemDeErro", () => {
  it("usa a mensagem devolvida pela API", () => {
    expect(mensagemDeErro(erroComCorpo({ message: "Senha incorreta." }), "padrão")).toBe(
      "Senha incorreta.",
    );
  });

  it("cai no padrão quando a resposta não traz uma mensagem utilizável", () => {
    expect(mensagemDeErro(erroComCorpo({}), "padrão")).toBe("padrão");
    expect(mensagemDeErro(erroComCorpo({ message: "" }), "padrão")).toBe("padrão");
    expect(mensagemDeErro(erroComCorpo({ message: 42 }), "padrão")).toBe("padrão");
    expect(mensagemDeErro(erroComCorpo(undefined), "padrão")).toBe("padrão");
  });

  it("cai no padrão quando não houve resposta (rede) ou o erro não é do Axios", () => {
    expect(mensagemDeErro(new AxiosError("Network Error"), "padrão")).toBe("padrão");
    expect(mensagemDeErro(new Error("qualquer"), "padrão")).toBe("padrão");
    expect(mensagemDeErro(null, "padrão")).toBe("padrão");
  });
});
