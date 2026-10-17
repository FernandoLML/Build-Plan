// Caminho: /frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

// Config base (Tailwind v3). O `npx shadcn init` acrescenta os tokens de tema
// (cores via CSS variables, radius etc.) quando os componentes forem adicionados.
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;