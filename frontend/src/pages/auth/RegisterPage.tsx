// Caminho: /frontend/src/pages/auth/RegisterPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/lib/token";
import { mensagemDeErro } from "@/lib/erroApi";
import { useAuth } from "@/auth/useAuth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  nome: z.string().min(3, "O nome deve ter ao menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  // Consentimento exigido pela LGPD (RFC §6.2); a API também recusa sem ele.
  aceitePrivacidade: z.boolean().refine((aceito) => aceito, {
    message: "É necessário aceitar a Política de Privacidade.",
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

const LINK = "font-medium text-indigo-400 hover:text-indigo-300";

export function RegisterPage() {
  const { setUsuario } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { aceitePrivacidade: false },
  });

  async function onSubmit({ nome, email, senha }: RegisterForm) {
    setErro(null);
    try {
      const { token, usuario } = await authApi.register({
        nome,
        email,
        senha,
        aceitePrivacidade: true, // o schema só chega aqui com o aceite marcado
      });
      tokenStorage.set(token);
      setUsuario(usuario);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível cadastrar. Tente novamente."));
    }
  }

  return (
    <AuthCard subtitulo="Crie sua conta para começar." erro={erro}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <input
              id="aceitePrivacidade"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 accent-indigo-600"
              {...register("aceitePrivacidade")}
            />
            <Label htmlFor="aceitePrivacidade" className="text-sm font-normal leading-snug text-slate-300">
              Li e aceito a{" "}
              <Link to="/privacidade" className={LINK}>
                Política de Privacidade
              </Link>
              .
            </Label>
          </div>
          {errors.aceitePrivacidade && (
            <p className="text-xs text-red-400">{errors.aceitePrivacidade.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Cadastrando…" : "Cadastrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Já tem conta?{" "}
        <Link to="/login" className={LINK}>
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
