// Caminho: /frontend/src/pages/auth/EsqueciSenhaPage.tsx
// "Esqueci minha senha": pede o e-mail e solicita o link de redefinição.
// A API responde igual para e-mail cadastrado ou não, e a tela também.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { authApi } from "@/api/auth";
import { mensagemDeErro } from "@/lib/erroApi";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const esqueciSenhaSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

type EsqueciSenhaForm = z.infer<typeof esqueciSenhaSchema>;

export function EsqueciSenhaPage() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaForm>({ resolver: zodResolver(esqueciSenhaSchema) });

  async function onSubmit({ email }: EsqueciSenhaForm) {
    setErro(null);
    try {
      const { message } = await authApi.esqueciSenha(email);
      setEnviado(message);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível enviar o pedido. Tente novamente."));
    }
  }

  return (
    <AuthCard
      subtitulo="Informe o e-mail da sua conta para receber o link de redefinição de senha."
      erro={erro}
      sucesso={enviado}
    >
      {!enviado && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@empresa.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando…" : "Enviar link"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400">
        <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  );
}
