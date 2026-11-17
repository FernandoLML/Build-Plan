// Caminho: /frontend/src/components/materiais/VincularEtapaDialog.test.tsx
// Vínculo material-etapa: o diálogo mostra o saldo do material e não deixa
// vincular mais do que ele tem no catálogo.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderComProviders } from "@/test/utils";
import { VincularEtapaDialog } from "./VincularEtapaDialog";
import type { SaldoMaterial } from "@/lib/suprimentos";
import type { Material } from "@/types/material";

vi.mock("@/api/materiais", () => ({
  materiaisApi: {},
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { criar: vi.fn() },
}));
import { etapasApi, vinculosApi } from "@/api/materiais";

const ETAPA_ID = "3f1c2b9e-8a4d-4f6b-9c2e-1a7d5e3b8c40";

const material: Material = {
  id: "m1",
  nome: "Cimento CP-II",
  especificacao: null,
  unidade: "sc",
  quantidade: "10",
  origem: "MANUAL",
  codigoSinapi: null,
  obraId: "obra-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderDialogo(saldo: SaldoMaterial | null) {
  const onOpenChange = vi.fn();
  renderComProviders(
    <VincularEtapaDialog open onOpenChange={onOpenChange} material={material} obraId="obra-1" saldo={saldo} />,
  );
  return { onOpenChange, user: userEvent.setup() };
}

async function escolherEtapa(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Fundação" }));
}

beforeEach(() => {
  vi.mocked(etapasApi.listar).mockResolvedValue([
    {
      id: ETAPA_ID,
      nome: "Fundação",
      descricao: null,
      ordem: 1,
      obraId: "obra-1",
      totalTarefas: 0,
      tarefasConcluidas: 0,
      progresso: 0,
      totalMateriaisVinculados: 0,
    },
  ]);
});

describe("VincularEtapaDialog — saldo do material", () => {
  it("mostra o disponível, o total do catálogo e o já vinculado", () => {
    renderDialogo({ total: 10, vinculado: 7.5, disponivel: 2.5 });

    const saldo = screen.getByTestId("saldo-material");
    expect(saldo).toHaveTextContent("Disponível para vincular: 2,5 sc");
    expect(saldo).toHaveTextContent("Catálogo: 10 sc · já vinculado: 7,5 sc");
  });

  it("não envia quantidade acima do saldo e explica o limite", async () => {
    const { user } = renderDialogo({ total: 10, vinculado: 7.5, disponivel: 2.5 });

    await escolherEtapa(user);
    await user.type(screen.getByLabelText("Quantidade"), "3");
    await user.click(screen.getByRole("button", { name: "Vincular" }));

    expect(await screen.findByText("Máximo disponível: 2,5 sc.")).toBeInTheDocument();
    expect(vinculosApi.criar).not.toHaveBeenCalled();
  });

  it("vincula exatamente o saldo e fecha o diálogo", async () => {
    vi.mocked(vinculosApi.criar).mockResolvedValue({} as never);
    const { user, onOpenChange } = renderDialogo({ total: 10, vinculado: 7.5, disponivel: 2.5 });

    await escolherEtapa(user);
    await user.type(screen.getByLabelText("Quantidade"), "2.5");
    await user.click(screen.getByRole("button", { name: "Vincular" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vinculosApi.criar).toHaveBeenCalledWith(ETAPA_ID, {
      materialId: "m1",
      quantidade: 2.5,
      local: undefined,
    });
  });

  it("sem saldo, avisa e desabilita o botão de vincular", () => {
    renderDialogo({ total: 10, vinculado: 10, disponivel: 0 });

    expect(screen.getByTestId("saldo-material")).toHaveTextContent("Todo o material já está vinculado.");
    expect(screen.getByRole("button", { name: "Vincular" })).toBeDisabled();
  });

  it("mostra a mensagem da API se o saldo mudou desde que o diálogo abriu", async () => {
    const resposta = {
      status: 400,
      data: { message: "Quantidade acima do disponível. Saldo para vincular: 1 sc (catálogo: 10 sc; já vinculado: 9 sc)." },
    } as AxiosResponse;
    vi.mocked(vinculosApi.criar).mockRejectedValue(
      new AxiosError("erro", "ERR_BAD_REQUEST", undefined, undefined, resposta),
    );
    const { user } = renderDialogo({ total: 10, vinculado: 7.5, disponivel: 2.5 });

    await escolherEtapa(user);
    await user.type(screen.getByLabelText("Quantidade"), "2");
    await user.click(screen.getByRole("button", { name: "Vincular" }));

    expect(await screen.findByText(/Saldo para vincular: 1 sc/)).toBeInTheDocument();
  });

  it("sem saldo calculado (vínculos carregando), não limita no navegador", () => {
    renderDialogo(null);

    expect(screen.queryByTestId("saldo-material")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vincular" })).toBeEnabled();
  });
});
