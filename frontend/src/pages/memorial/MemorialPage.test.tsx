// Caminho: /frontend/src/pages/memorial/MemorialPage.test.tsx
// Tela 3 — Importação do Memorial: download do template CSV gerado no cliente.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { MemorialPage } from "./MemorialPage";

const obraAtiva = vi.hoisted(() => ({ id: "obra-1" as string | null }));
vi.mock("@/contexts/useObraAtiva", () => ({
  useObraAtiva: () => ({ obraAtivaId: obraAtiva.id, selecionarObra: vi.fn(), limparObraAtiva: vi.fn() }),
}));
vi.mock("@/api/memorial", () => ({ memorialApi: { preview: vi.fn(), importar: vi.fn() } }));

/** Lê os bytes do Blob (Blob.text() descartaria o BOM ao decodificar). */
function lerBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe("MemorialPage — template CSV", () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:template");
  const revokeObjectURL = vi.fn();
  const urlOriginal = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

  beforeEach(() => {
    obraAtiva.id = "obra-1";
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = urlOriginal.create;
    URL.revokeObjectURL = urlOriginal.revoke;
  });

  it("dispara o download do template com BOM UTF-8, ';' e cabeçalho do parser", async () => {
    const cliques: HTMLAnchorElement[] = [];
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        cliques.push(this);
      });
    const user = userEvent.setup();
    renderComProviders(<MemorialPage />);

    await user.click(screen.getByRole("button", { name: /Baixar Template \(\.csv\)/ }));

    // Âncora temporária com nome do arquivo e URL do Blob, clicada uma vez e removida.
    expect(click).toHaveBeenCalledTimes(1);
    expect(cliques[0].download).toBe("template-memorial.csv");
    expect(cliques[0].href).toBe("blob:template");
    expect(cliques[0].isConnected).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:template");

    // Conteúdo do Blob.
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("text/csv;charset=utf-8");
    const bytes = await lerBytes(blob);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).slice(1);
    const linhas = texto.trimEnd().split("\r\n");
    expect(linhas[0]).toBe("Nome;Especificacao;Unidade;Quantidade;Codigo SINAPI");
    expect(linhas.length - 1).toBeGreaterThanOrEqual(2);
    expect(texto).toContain("Cimento Portland CP II-32;Saco de 50 kg;KG;2500;00001379");
    expect(texto).toContain("Areia média"); // acentuação preservada em UTF-8
  });

  it("não exibe o botão sem obra ativa", () => {
    obraAtiva.id = null;
    renderComProviders(<MemorialPage />);
    expect(screen.queryByRole("button", { name: /Baixar Template/ })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma obra selecionada")).toBeInTheDocument();
  });
});
