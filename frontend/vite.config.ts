// Caminho: /frontend/vite.config.ts
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Na Vercel, falha o build se a URL da API não estiver configurada (ou não for
// https): sem isso o site subiria apontando para http://localhost:3333.
function exigirApiUrlNaVercel(mode: string): void {
  if (process.env.VERCEL !== "1") return;
  const apiUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL?.trim() ?? "";
  if (!apiUrl.startsWith("https://")) {
    throw new Error(
      "VITE_API_URL ausente ou sem https://. Defina em Vercel > Settings > Environment Variables " +
        "(ex.: https://api.seu-dominio.com/api) e refaça o deploy.",
    );
  }
}

const configuracao = {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  // Usa o minificador de CSS do esbuild (mais tolerante que o lightningcss) para
  // o bundle de produção, evitando falsos positivos de parse durante o `vite build`.
  build: {
    cssMinify: "esbuild",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Cobertura (npm run test:coverage): gera coverage/lcov.info para o SonarCloud.
    // Exclui testes, infraestrutura de teste, primitivos shadcn (components/ui),
    // bootstrap da aplicação e arquivos só de tipos.
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/types/**",
      ],
    },
  },
};

export default defineConfig(({ mode }) => {
  exigirApiUrlNaVercel(mode);
  return configuracao;
});
