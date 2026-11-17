// Caminho: /frontend/src/pages/auth/PrivacidadePage.tsx
// Política de Privacidade (LGPD), conforme a Seção 6.2 do RFC. Página pública:
// é o texto com o qual o usuário concorda ao marcar o aceite no cadastro.

import { Link } from "react-router-dom";

const DADOS_COLETADOS = [
  { dado: "Nome", finalidade: "Identificar você dentro do sistema." },
  { dado: "E-mail", finalidade: "Login e envio do link de redefinição de senha." },
  { dado: "Senha", finalidade: "Autenticação. Guardamos apenas o hash (bcrypt), nunca a senha." },
  {
    dado: "Obras, etapas, tarefas e materiais",
    finalidade: "Funcionamento do sistema. Ficam vinculados à sua conta e só você os acessa.",
  },
  {
    dado: "Histórico de rastreabilidade",
    finalidade: "Registrar quem alterou o status de um material e quando.",
  },
];

const DIREITOS = [
  "Acessar os seus dados: tudo o que guardamos aparece nas telas do sistema.",
  "Corrigir nome e e-mail em Minha conta.",
  "Excluir a conta em Minha conta. Todos os dados vinculados são apagados na hora, sem possibilidade de recuperação.",
];

export function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 py-10">
      <article className="mx-auto max-w-2xl space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">
            Política de Privacidade
          </h1>
          <p className="text-slate-400">
            Como o Build-Plan trata os seus dados pessoais, nos termos da Lei Geral de Proteção de
            Dados (Lei nº 13.709/2018).
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-slate-100">Dados coletados</h2>
          <ul className="space-y-2">
            {DADOS_COLETADOS.map(({ dado, finalidade }) => (
              <li key={dado}>
                <span className="font-medium text-slate-100">{dado}:</span> {finalidade}
              </li>
            ))}
          </ul>
          <p>
            Não coletamos localização, dados bancários, documentos de identificação nem dados
            sensíveis (art. 5º da LGPD).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-slate-100">Seus direitos</h2>
          <ul className="list-disc space-y-1 pl-5">
            {DIREITOS.map((direito) => (
              <li key={direito}>{direito}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-semibold text-slate-100">Retenção</h2>
          <p>
            Os dados são mantidos enquanto a conta existir. Ao excluir a conta, eles são removidos
            do banco de dados imediatamente. Cópias de segurança são descartadas em até 14 dias.
          </p>
        </section>

        <p>
          <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            Voltar para o cadastro
          </Link>
        </p>
      </article>
    </div>
  );
}
