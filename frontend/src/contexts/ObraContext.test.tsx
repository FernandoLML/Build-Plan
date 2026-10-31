// Caminho: /frontend/src/contexts/ObraContext.test.tsx
// Testes do ObraProvider: seleção e persistência da obra ativa no localStorage,
// restauração ao montar e limpeza. (A LISTA de obras é responsabilidade do hook
// useObras — ver OBS no PR —, não deste contexto, que gerencia só a obra ativa.)

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { ObraProvider } from "./ObraContext";
import { useObraAtiva } from "./useObraAtiva";

const STORAGE_KEY = "buildplan.obraAtiva";

describe("ObraContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia sem obra ativa quando o localStorage está vazio", () => {
    const { result } = renderHook(() => useObraAtiva(), { wrapper: ObraProvider });

    expect(result.current.obraAtivaId).toBeNull();
  });

  it("seleciona a obra ativa e persiste o id no localStorage", () => {
    const { result } = renderHook(() => useObraAtiva(), { wrapper: ObraProvider });

    act(() => result.current.selecionarObra("obra-42"));

    expect(result.current.obraAtivaId).toBe("obra-42");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("obra-42");
  });

  it("restaura a obra ativa salva ao montar", () => {
    localStorage.setItem(STORAGE_KEY, "obra-99");

    const { result } = renderHook(() => useObraAtiva(), { wrapper: ObraProvider });

    expect(result.current.obraAtivaId).toBe("obra-99");
  });

  it("limpa a obra ativa e remove o id do localStorage", () => {
    const { result } = renderHook(() => useObraAtiva(), { wrapper: ObraProvider });

    act(() => result.current.selecionarObra("obra-42"));
    act(() => result.current.limparObraAtiva());

    expect(result.current.obraAtivaId).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});