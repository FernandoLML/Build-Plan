// Caminho: /backend/src/services/email.service.spec.ts
// Serviço de e-mail: envio pelo transporte e comportamento sem SMTP configurado.
// Nenhum servidor é contatado: o envio real usa o `jsonTransport` do
// nodemailer, que apenas serializa a mensagem.

import { describe, it, expect, jest, afterEach } from "@jest/globals";
import nodemailer from "nodemailer";
import { EmailService, criarTransporteSmtp } from "./email.service.js";

const REMETENTE = "Build-Plan <nao-responda@buildplan.test>";
const mensagem = { para: "ana@buildplan.test", assunto: "Assunto", texto: "Corpo com link secreto" };

afterEach(() => {
  jest.restoreAllMocks();
});

describe("EmailService.enviar", () => {
  it("envia pelo transporte com remetente, destinatário, assunto e texto", async () => {
    const transporte = nodemailer.createTransport({ jsonTransport: true });
    const sendMail = jest.spyOn(transporte, "sendMail");
    const servico = new EmailService(transporte, REMETENTE, "production");

    expect(await servico.enviar(mensagem)).toBe(true);
    expect(sendMail).toHaveBeenCalledWith({
      from: REMETENTE,
      to: mensagem.para,
      subject: mensagem.assunto,
      text: mensagem.texto,
    });
  });

  it("propaga a falha do transporte para quem chamou", async () => {
    const transporte = { sendMail: () => Promise.reject(new Error("conexão recusada")) };
    const servico = new EmailService(transporte, REMETENTE, "production");

    await expect(servico.enviar(mensagem)).rejects.toThrow("conexão recusada");
  });

  it("sem SMTP em desenvolvimento: mostra a mensagem no console", async () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const servico = new EmailService(null, REMETENTE, "development");

    expect(await servico.enviar(mensagem)).toBe(false);
    expect(info.mock.calls[0][0]).toContain(mensagem.texto);
  });

  it("sem SMTP em produção: avisa sem expor o conteúdo (link secreto)", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const servico = new EmailService(null, REMETENTE, "production");

    expect(await servico.enviar(mensagem)).toBe(false);
    expect(info).not.toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain("link secreto");
    expect(JSON.stringify(warn.mock.calls)).not.toContain(mensagem.para);
  });

  it("sem SMTP em teste: não escreve nada", async () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(await new EmailService(null, REMETENTE, "test").enviar(mensagem)).toBe(false);
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("criarTransporteSmtp", () => {
  it("devolve null quando não há host configurado", () => {
    expect(criarTransporteSmtp({ porta: 587 })).toBeNull();
  });

  it("cria o transporte com STARTTLS obrigatório na porta 587", () => {
    const transporte = criarTransporteSmtp({
      host: "smtp.buildplan.test",
      porta: 587,
      usuario: "usuario",
      senha: "segredo",
    }) as unknown as { options: Record<string, unknown> };

    expect(transporte.options).toMatchObject({
      host: "smtp.buildplan.test",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "usuario", pass: "segredo" },
    });
  });

  it("usa TLS direto na porta 465 e dispensa auth quando não há credenciais", () => {
    const transporte = criarTransporteSmtp({ host: "smtp.buildplan.test", porta: 465 }) as unknown as {
      options: Record<string, unknown>;
    };

    expect(transporte.options).toMatchObject({ port: 465, secure: true, requireTLS: false });
    expect(transporte.options.auth).toBeUndefined();
  });
});
