import { env } from "../config/env.js";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

class MailService {
  async send({ to, subject, html }: SendMailInput) {
    if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
      throw new Error(
        "Configuração de email ausente. Defina RESEND_API_KEY e MAIL_FROM no ambiente.",
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Erro ao enviar email pelo Resend: ${body}`);
    }
  }
}

export const mailService = new MailService();
