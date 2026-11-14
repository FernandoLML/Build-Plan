// Caminho: /frontend/vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
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
});