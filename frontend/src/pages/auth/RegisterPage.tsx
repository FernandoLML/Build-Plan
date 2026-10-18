// Caminho: /frontend/src/pages/auth/RegisterPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/lib/token";
import { useAuth } from "@/auth/useAuth";

const registerSchema = z.object({
  nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { setUsuario } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(dados: RegisterForm) {
    setErro(null);
    try {
      // O registro já devolve o token — estabelece a sessão imediatamente.
      const { token, usuario } = await authApi.register(dados);
      tokenStorage.set(token);
      setUsuario(usuario);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg =
        e instanceof AxiosError
          ? (e.response?.data as { message?: string })?.message
          : undefined;
      setErro(msg ?? "Não foi possível cadastrar. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Build-Plan — Criar conta</h1>

        {erro && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="nome">Nome</label>
          <input
            id="nome"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            {...register("nome")}
          />
          {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
        </div>

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
          {isSubmitting ? "Cadastrando…" : "Cadastrar"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}