// Caminho: /frontend/src/components/auth/AuthCard.tsx
// Moldura das telas públicas (login, cadastro, recuperação de senha): logo,
// subtítulo e, quando houver, a mensagem de erro ou de sucesso.

import type { ReactNode } from "react";
import { Boxes } from "lucide-react";

interface AuthCardProps {
  subtitulo: string;
  erro?: string | null;
  sucesso?: string | null;
  children: ReactNode;
}

export function AuthCard({ subtitulo, erro, sucesso, children }: Readonly<AuthCardProps>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-indigo-500" />
          <h1 className="font-display text-xl font-semibold tracking-tight text-slate-100">
            Build-Plan
          </h1>
        </div>
        <p className="text-sm text-slate-400">{subtitulo}</p>

        {erro && (
          <p
            role="alert"
            className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {erro}
          </p>
        )}
        {sucesso && (
          <output className="block rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            {sucesso}
          </output>
        )}

        {children}
      </div>
    </div>
  );
}
