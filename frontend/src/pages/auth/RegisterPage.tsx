// Caminho: /frontend/src/pages/auth/RegisterPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { Boxes } from "lucide-react";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/lib/token";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <p className="text-sm text-slate-400">Crie sua conta para começar.</p>

        {erro && (
          <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="nome" className="text-slate-300">Nome</Label>
          <Input id="nome" placeholder="Seu nome" {...register("nome")} />
          {errors.nome && <p className="text-xs text-red-400">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha" className="text-slate-300">Senha</Label>
          <Input id="senha" type="password" placeholder="Mínimo de 8 caracteres" {...register("senha")} />
          {errors.senha && <p className="text-xs text-red-400">{errors.senha.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Cadastrando…" : "Cadastrar"}
        </Button>

        <p className="text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}