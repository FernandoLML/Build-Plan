// Caminho: /frontend/src/pages/auth/RecuperacaoSenha.test.tsx
// Fluxo "esqueci minha senha": pedido do link (EsqueciSenhaPage) e definição
// da nova senha a partir do token da URL (RedefinirSenhaPage).

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { renderComProviders } from "@/test/utils";
import { EsqueciSenhaPage } from "./EsqueciSenhaPage";
import { RedefinirSenhaPage } from "./RedefinirSenhaPage";

vi.mock("@/api/auth", () => ({
  authApi: { esqueciSenha: vi.fn(), redefinirSenha: vi.fn() },
}));
import { authApi } from "@/api/auth";

function erroDaApi(status: number, message: string): AxiosError {
  const resposta = { status, data: { message } } as AxiosResponse;
  return new AxiosError(message, "ERR_BAD_REQUEST", undefined, undefined, resposta);
}

describe("EsqueciSenhaPage", () => {
  const MENSAGEM = "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.";

  it("envia o e-mail e mostra a confirmação no lugar do formulário", async () => {
    vi.mocked(authApi.esqueciSenha).mockResolvedValue({ message: MENSAGEM });
    const user = userEvent.setup();
    renderComProviders(<EsqueciSenhaPage />);

    await user.type(screen.getByLabelText("E-mail"), "ana@buildplan.test");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(await screen.findByRole("status")).toHaveTextContent(MENSAGEM);
    expect(authApi.esqueciSenha).toHaveBeenCalledWith("ana@buildplan.test");
    expect(screen.queryByRole("button", { name: "Enviar link" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para o login" })).toHaveAttribute("href", "/login");
  });

  it("valida o e-mail antes de chamar a API", async () => {
    const user = userEvent.setup();
    renderComProviders(<EsqueciSenhaPage />);

    await user.type(screen.getByLabelText("E-mail"), "nao-eh-email");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(authApi.esqueciSenha).not.toHaveBeenCalled();
  });

  it("mostra a mensagem da API quando o limite de pedidos é atingido", async () => {
    vi.mocked(authApi.esqueciSenha).mockRejectedValue(
      erroDaApi(429, "Muitos pedidos de redefinição de senha. Tente novamente mais tarde."),
    );
    const user = userEvent.setup();
    renderComProviders(<EsqueciSenhaPage />);

    await user.type(screen.getByLabelText("E-mail"), "ana@buildplan.test");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/muitos pedidos/i);
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeInTheDocument();
  });

  it("usa uma mensagem padrão quando o erro não vem da API", async () => {
    vi.mocked(authApi.esqueciSenha).mockRejectedValue(new Error("rede fora do ar"));
    const user = userEvent.setup();
    renderComProviders(<EsqueciSenhaPage />);

    await user.type(screen.getByLabelText("E-mail"), "ana@buildplan.test");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o pedido.");
  });
});

describe("RedefinirSenhaPage", () => {
  const ROTA = "/redefinir-senha?token=abc123";

  async function preencher(user: ReturnType<typeof userEvent.setup>, senha: string, confirmacao = senha) {
    await user.type(screen.getByLabelText("Nova senha"), senha);
    await user.type(screen.getByLabelText("Confirmar nova senha"), confirmacao);
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
  }

  it("envia o token da URL com a nova senha e confirma a troca", async () => {
    vi.mocked(authApi.redefinirSenha).mockResolvedValue({ message: "Senha redefinida." });
    const user = userEvent.setup();
    renderComProviders(<RedefinirSenhaPage />, { rota: ROTA });

    await preencher(user, "novaSenha456");

    expect(await screen.findByRole("status")).toHaveTextContent("Senha redefinida.");
    expect(authApi.redefinirSenha).toHaveBeenCalledWith("abc123", "novaSenha456");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute("href", "/login");
  });

  it("exige senha com 8 caracteres e confirmação igual", async () => {
    const user = userEvent.setup();
    renderComProviders(<RedefinirSenhaPage />, { rota: ROTA });

    await preencher(user, "curta");
    expect(await screen.findByText("A senha deve ter ao menos 8 caracteres.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Nova senha"));
    await user.clear(screen.getByLabelText("Confirmar nova senha"));
    await preencher(user, "novaSenha456", "outraSenha789");

    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(authApi.redefinirSenha).not.toHaveBeenCalled();
  });

  it("com link expirado, mostra o erro e oferece pedir um novo", async () => {
    vi.mocked(authApi.redefinirSenha).mockRejectedValue(
      erroDaApi(400, "Link de redefinição inválido ou expirado. Solicite um novo."),
    );
    const user = userEvent.setup();
    renderComProviders(<RedefinirSenhaPage />, { rota: ROTA });

    await preencher(user, "novaSenha456");

    expect(await screen.findByRole("alert")).toHaveTextContent(/inválido ou expirado/i);
    expect(screen.getByRole("link", { name: "Solicitar novo link" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
  });

  it("sem token na URL, não mostra o formulário", () => {
    renderComProviders(<RedefinirSenhaPage />, { rota: "/redefinir-senha" });

    expect(screen.getByRole("alert")).toHaveTextContent("Link de redefinição inválido.");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitar novo link" })).toBeInTheDocument();
  });
});
