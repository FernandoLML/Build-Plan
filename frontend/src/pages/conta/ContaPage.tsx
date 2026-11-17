// Caminho: /frontend/src/pages/conta/ContaPage.tsx
// Minha conta: correção dos dados pessoais e exclusão da conta — os direitos
// do titular previstos na LGPD (RFC §6.2).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuth } from "@/auth/useAuth";
import { mensagemDeErro } from "@/lib/erroApi";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const perfilSchema = z.object({
  nome: z.string().trim().min(3, "O nome deve ter ao menos 3 caracteres.").max(120),
  email: z.string().trim().email("E-mail inválido."),
});
type PerfilForm = z.infer<typeof perfilSchema>;

const exclusaoSchema = z.object({
  senha: z.string().min(1, "Informe a senha para confirmar."),
});
type ExclusaoForm = z.infer<typeof exclusaoSchema>;

const CARTAO = "space-y-4 rounded-lg border bg-slate-900 p-5";

export function ContaPage() {
  const { usuario, setUsuario, logout } = useAuth();
  const navigate = useNavigate();

  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const perfil = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    values: { nome: usuario?.nome ?? "", email: usuario?.email ?? "" },
  });
  const exclusao = useForm<ExclusaoForm>({ resolver: zodResolver(exclusaoSchema) });

  async function salvarPerfil(dados: PerfilForm) {
    setErroPerfil(null);
    setPerfilSalvo(false);
    try {
      setUsuario(await authApi.atualizarPerfil(dados));
      setPerfilSalvo(true);
    } catch (e) {
      setErroPerfil(mensagemDeErro(e, "Não foi possível salvar. Tente novamente."));
    }
  }

  async function excluirConta({ senha }: ExclusaoForm) {
    setErroExclusao(null);
    try {
      await authApi.excluirConta(senha);
      // Nada do usuário pode sobrar no navegador: sessão e cache de dados.
      queryClient.clear();
      logout();
      navigate("/login", { replace: true });
    } catch (e) {
      setErroExclusao(mensagemDeErro(e, "Não foi possível excluir a conta. Tente novamente."));
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">
          Minha conta
        </h1>
        <p className="text-sm text-slate-400">
          Seus dados pessoais.{" "}
          <Link to="/privacidade" className="font-medium text-indigo-400 hover:text-indigo-300">
            Política de Privacidade
          </Link>
        </p>
      </header>

      <form
        onSubmit={perfil.handleSubmit(salvarPerfil)}
        className={`${CARTAO} border-slate-800`}
        aria-label="Dados pessoais"
        noValidate
      >
        <h2 className="font-display text-base font-semibold text-slate-100">Dados pessoais</h2>

        {erroPerfil && <p role="alert" className="text-sm text-red-400">{erroPerfil}</p>}
        {perfilSalvo && <p role="status" className="text-sm text-emerald-400">Dados atualizados.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="nome" className="text-slate-300">Nome</Label>
          <Input id="nome" {...perfil.register("nome")} />
          {perfil.formState.errors.nome && (
            <p className="text-xs text-red-400">{perfil.formState.errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300">E-mail</Label>
          <Input id="email" type="email" {...perfil.register("email")} />
          {perfil.formState.errors.email && (
            <p className="text-xs text-red-400">{perfil.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" disabled={perfil.formState.isSubmitting}>
          {perfil.formState.isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <form
        onSubmit={exclusao.handleSubmit(excluirConta)}
        className={`${CARTAO} border-red-500/30`}
        aria-label="Excluir conta"
        noValidate
      >
        <h2 className="font-display text-base font-semibold text-red-400">Excluir conta</h2>
        <p className="text-sm text-slate-400">
          Apaga a sua conta e <strong className="text-slate-200">todos</strong> os dados vinculados
          a ela: obras, etapas, tarefas, materiais, listas de compras e histórico. Esta ação não
          pode ser desfeita.
        </p>

        {erroExclusao && <p role="alert" className="text-sm text-red-400">{erroExclusao}</p>}

        <div className="space-y-1.5">
          <Label htmlFor="senha-exclusao" className="text-slate-300">Confirme com a sua senha</Label>
          <Input id="senha-exclusao" type="password" {...exclusao.register("senha")} />
          {exclusao.formState.errors.senha && (
            <p className="text-xs text-red-400">{exclusao.formState.errors.senha.message}</p>
          )}
        </div>

        <Button type="submit" variant="destructive" disabled={exclusao.formState.isSubmitting}>
          {exclusao.formState.isSubmitting ? "Excluindo…" : "Excluir minha conta"}
        </Button>
      </form>
    </div>
  );
}
