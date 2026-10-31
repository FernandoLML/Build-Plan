// Caminho: /frontend/src/test/utils.tsx
// Utilitários de teste: wrapper com QueryClientProvider + MemoryRouter.
// Cada teste recebe um QueryClient novo (sem retry/cache) para isolamento.

import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  client?: QueryClient;
  rota?: string;
}

/** Renderiza a UI dentro dos providers de dados e rota da aplicação. */
export function renderComProviders(
  ui: ReactElement,
  { client, rota = "/", ...options }: ProvidersOptions = {},
): RenderResult & { client: QueryClient } {
  const queryClient = client ?? criarQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { client: queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}