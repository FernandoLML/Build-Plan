// Caminho: /frontend/vite.config.ts
/// <reference types="vitest/config" />
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
  },
});