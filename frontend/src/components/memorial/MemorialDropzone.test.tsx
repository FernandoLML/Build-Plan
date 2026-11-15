// Caminho: /frontend/src/components/memorial/MemorialDropzone.test.tsx
// Testes da área de upload: seletor nativo acessível, validações e drag-and-drop.

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MemorialDropzone } from "./MemorialDropzone";

const ROTULO = /Arraste o arquivo do memorial/;

function renderDropzone(disabled = false) {
  const onArquivoLido = vi.fn();
  const onErro = vi.fn();
  render(<MemorialDropzone onArquivoLido={onArquivoLido} onErro={onErro} disabled={disabled} />);
  return { onArquivoLido, onErro, input: screen.getByLabelText(ROTULO) };
}

describe("MemorialDropzone", () => {
  it("expõe um input de arquivo nativo associado ao rótulo (acessível por teclado)", () => {
    const { input } = renderDropzone();

    expect(input).toHaveAttribute("type", "file");
    expect(input).not.toBeDisabled();
  });

  it("lê o conteúdo de um CSV selecionado", async () => {
    const user = userEvent.setup();
    const { onArquivoLido, input } = renderDropzone();

    await user.upload(input, new File(["nome;unidade\nCimento;sc"], "memorial.csv", { type: "text/csv" }));

    await waitFor(() => expect(onArquivoLido).toHaveBeenCalledWith("nome;unidade\nCimento;sc", "memorial.csv"));
  });

  it("rejeita extensões não suportadas", () => {
    const { onErro, onArquivoLido, input } = renderDropzone();

    fireEvent.change(input, { target: { files: [new File(["x"], "memorial.pdf")] } });

    expect(onErro).toHaveBeenCalledWith("Formato não suportado. Envie um arquivo .csv ou .txt.");
    expect(onArquivoLido).not.toHaveBeenCalled();
  });

  it("rejeita arquivos acima de 2MB", () => {
    const { onErro, input } = renderDropzone();
    const grande = new File(["x"], "grande.csv");
    Object.defineProperty(grande, "size", { value: 3 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [grande] } });

    expect(onErro).toHaveBeenCalledWith("Arquivo muito grande (máximo de 2MB).");
  });

  it("informa falha de leitura do arquivo", async () => {
    const { onErro, input } = renderDropzone();
    const arquivo = new File(["x"], "memorial.txt");
    arquivo.text = () => Promise.reject(new Error("falha"));

    fireEvent.change(input, { target: { files: [arquivo] } });

    await waitFor(() => expect(onErro).toHaveBeenCalledWith("Falha ao ler o arquivo."));
  });

  it("aceita arquivo solto via drag-and-drop", async () => {
    const { onArquivoLido } = renderDropzone();
    const zona = screen.getByText(ROTULO).closest("label") as HTMLElement;
    const arquivo = new File(["a;b"], "memorial.txt", { type: "text/plain" });

    fireEvent.dragOver(zona);
    fireEvent.dragLeave(zona);
    fireEvent.drop(zona, { dataTransfer: { files: [arquivo] } });

    await waitFor(() => expect(onArquivoLido).toHaveBeenCalledWith("a;b", "memorial.txt"));
  });

  it("ignora o drop quando desabilitado", () => {
    const { onArquivoLido, input } = renderDropzone(true);
    const zona = screen.getByText(ROTULO).closest("label") as HTMLElement;

    fireEvent.dragOver(zona);
    fireEvent.drop(zona, { dataTransfer: { files: [new File(["a"], "m.csv")] } });

    expect(input).toBeDisabled();
    expect(onArquivoLido).not.toHaveBeenCalled();
  });
});
