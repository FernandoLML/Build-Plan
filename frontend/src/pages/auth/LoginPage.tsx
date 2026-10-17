// Caminho: /frontend/src/pages/auth/LoginPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Build-Plan — Entrar</h1>

        {erro && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            {...register("senha")}
          />
          {errors.senha && <p className="text-xs text-red-600">{errors.senha.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Entrando…" : "Entrar"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}