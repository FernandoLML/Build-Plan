// Caminho: /frontend/src/pages/auth/LoginPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/auth/useAuth";
import { mensagemDeErro } from "@/lib/erroApi";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

type LoginForm = z.infer<typeof loginSchema>;

const LINK = "font-medium text-indigo-400 hover:text-indigo-300";

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
      setErro(mensagemDeErro(e, "Não foi possível entrar. Tente novamente."));
    }
  }

  return (
    <AuthCard subtitulo="Acesse sua conta para continuar." erro={erro}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha" className="text-slate-300">Senha</Label>
            <Link to="/esqueci-senha" className={`text-xs ${LINK}`}>
              Esqueci minha senha
            </Link>
          </div>
          <Input id="senha" type="password" placeholder="••••••••" {...register("senha")} />
          {errors.senha && <p className="text-xs text-red-400">{errors.senha.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Não tem conta?{" "}
        <Link to="/register" className={LINK}>
          Cadastre-se
        </Link>
      </p>
    </AuthCard>
  );
}
