// Caminho: /frontend/src/lib/memorialTemplate.test.ts
// Template CSV do memorial: BOM, delimitador, cabeçalho compatível com o parser e exemplos.

import { describe, it, expect } from "vitest";
import { gerarTemplateMemorialCsv, UTF8_BOM } from "./memorialTemplate";

// Mesma normalização e sinônimos do parser (backend/src/services/memorial.service.ts).
const normalizar = (t: string) =>
  t.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

describe("gerarTemplateMemorialCsv", () => {
  const csv = gerarTemplateMemorialCsv();
  const linhas = csv.slice(UTF8_BOM.length).trimEnd().split("\r\n");

  it("começa com o BOM UTF-8", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("usa o cabeçalho exato esperado, delimitado por ';'", () => {
    expect(linhas[0]).toBe("Nome;Especificacao;Unidade;Quantidade;Codigo SINAPI");
    expect(linhas[0].split(";").map(normalizar)).toEqual([
      "nome",
      "especificacao",
      "unidade",
      "quantidade",
      "codigosinapi",
    ]);
  });

  it("traz de 2 a 3 linhas de exemplo com 5 colunas, quantidade positiva e código SINAPI", () => {
    const dados = linhas.slice(1);
    expect(dados.length).toBeGreaterThanOrEqual(2);
    expect(dados.length).toBeLessThanOrEqual(3);
    for (const linha of dados) {
      const [nome, , unidade, quantidade, codigo] = linha.split(";");
      expect(linha.split(";")).toHaveLength(5);
      expect(nome.length).toBeGreaterThanOrEqual(2);
      expect(unidade).not.toBe("");
      expect(Number(quantidade.replace(",", "."))).toBeGreaterThan(0);
      expect(codigo).toMatch(/^\d{8}$/);
    }
    expect(csv).toContain("00001379"); // cimento CP II-32 (mesmo código dos fixtures SINAPI)
  });
});
