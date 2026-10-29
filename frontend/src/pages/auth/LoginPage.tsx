// Caminho: /frontend/src/pages/auth/LoginPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/useAuth";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(dados: LoginForm) {
    setErro(null);
    try {
      await login(dados);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg =
        e instanceof AxiosError
          ? (e.response?.data as { message?: string })?.message
          : undefined;
      setErro(msg ?? "Não foi possível entrar. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-indigo-500" />
          <h1 className="font-display text-xl font-semibold tracking-tight text-slate-100">
            Build-Plan
          </h1>
        </div>
        <p className="text-sm text-slate-400">Acesse sua conta para continuar.</p>

        {erro && (
          <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha" className="text-slate-300">Senha</Label>
          <Input id="senha" type="password" placeholder="••••••••" {...register("senha")} />
          {errors.senha && <p className="text-xs text-red-400">{errors.senha.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>

        <p className="text-center text-sm text-slate-400">
          Não tem conta?{" "}
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}