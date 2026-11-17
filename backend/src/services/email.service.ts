// Caminho: /backend/src/services/email.service.ts
// Envio de e-mails transacionais por SMTP (nodemailer).
// Sem SMTP configurado nada é enviado: em desenvolvimento a mensagem aparece
// no console (para testar o fluxo sem provedor); em produção só é registrado
// que o envio não aconteceu, sem o conteúdo, pois ele carrega o link secreto.

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export interface MensagemEmail {
  para: string;
  assunto: string;
  texto: string;
}

/** Parte do transporte do nodemailer que o serviço usa (facilita os testes). */
export interface TransporteEmail {
  sendMail(mensagem: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
}

export interface ConfiguracaoSmtp {
  host?: string;
  porta: number;
  usuario?: string;
  senha?: string;
}

/** Cria o transporte SMTP, ou `null` quando não há servidor configurado. */
export function criarTransporteSmtp(config: ConfiguracaoSmtp): TransporteEmail | null {
  if (!config.host) return null;
  return nodemailer.createTransport({
    host: config.host,
    port: config.porta,
    // 465 usa TLS desde a conexão; nas demais portas (587) o nodemailer
    // negocia STARTTLS, e exigimos que isso aconteça.
    secure: config.porta === 465,
    requireTLS: config.porta !== 465,
    auth: config.usuario && config.senha ? { user: config.usuario, pass: config.senha } : undefined,
  });
}

export class EmailService {
  constructor(
    private readonly transporte: TransporteEmail | null,
    private readonly remetente: string,
    private readonly ambiente: string,
  ) {}

  /** Envia a mensagem. Devolve `false` quando não há SMTP configurado. */
  public async enviar(mensagem: MensagemEmail): Promise<boolean> {
    if (!this.transporte) {
      this.registrarNaoEnviado(mensagem);
      return false;
    }
    await this.transporte.sendMail({
      from: this.remetente,
      to: mensagem.para,
      subject: mensagem.assunto,
      text: mensagem.texto,
    });
    return true;
  }

  private registrarNaoEnviado(mensagem: MensagemEmail): void {
    if (this.ambiente === "development") {
      console.info(`[email] SMTP não configurado. Para: ${mensagem.para}\n${mensagem.texto}`);
    } else if (this.ambiente === "production") {
      console.warn("[email] SMTP não configurado: mensagem não enviada.");
    }
  }
}

export const emailService = new EmailService(
  criarTransporteSmtp({
    host: env.SMTP_HOST,
    porta: env.SMTP_PORT,
    usuario: env.SMTP_USER,
    senha: env.SMTP_PASS,
  }),
  env.EMAIL_REMETENTE,
  env.NODE_ENV,
);
