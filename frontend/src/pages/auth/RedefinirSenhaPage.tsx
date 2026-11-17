// Caminho: /frontend/src/pages/auth/RedefinirSenhaPage.tsx
// Destino do link enviado por e-mail (/redefinir-senha?token=...): define a
// nova senha. O token vem da URL e só é validado pela API.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth";
import { mensagemDeErro } from "@/lib/erroApi";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const redefinirSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres."),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não conferem.",
  });

type RedefinirSenhaForm = z.infer<typeof redefinirSenhaSchema>;

const LINK = "font-medium text-indigo-400 hover:text-indigo-300";

export function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaForm>({ resolver: zodResolver(redefinirSenhaSchema) });

  async function onSubmit({ senha }: RedefinirSenhaForm) {
    setErro(null);
    try {
      const { message } = await authApi.redefinirSenha(token, senha);
      setConcluido(message);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível redefinir a senha. Tente novamente."));
    }
  }

  if (!token) {
    return (
      <AuthCard
        subtitulo="Redefinição de senha"
        erro="Link de redefinição inválido. Solicite um novo link."
      >
        <p className="text-center text-sm text-slate-400">
          <Link to="/esqueci-senha" className={LINK}>
            Solicitar novo link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitulo="Escolha uma nova senha para a sua conta." erro={erro} sucesso={concluido}>
      {!concluido && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="senha" className="text-slate-300">Nova senha</Label>
            <Input id="senha" type="password" placeholder="Mínimo de 8 caracteres" {...register("senha")} />
            {errors.senha && <p className="text-xs text-red-400">{errors.senha.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmacao" className="text-slate-300">Confirmar nova senha</Label>
            <Input id="confirmacao" type="password" {...register("confirmacao")} />
            {errors.confirmacao && (
              <p className="text-xs text-red-400">{errors.confirmacao.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Salvando…" : "Redefinir senha"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400">
        {erro ? (
          <Link to="/esqueci-senha" className={LINK}>
            Solicitar novo link
          </Link>
        ) : (
          <Link to="/login" className={LINK}>
            Ir para o login
          </Link>
        )}
      </p>
    </AuthCard>
  );
}
