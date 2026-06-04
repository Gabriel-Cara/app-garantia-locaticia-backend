import { env } from "../config/env.js";

export function buildPasswordResetEmail(userName: string, resetUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Recuperação de senha - Doculoc</h2>
      <p>Olá, ${userName}.</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #0077b6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">
          Redefinir senha
        </a>
      </p>
      <p>Este link expira em ${env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutos.</p>
      <p>Se você não solicitou essa alteração, ignore este email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Caso o botão não funcione, copie e cole este link no navegador:</p>
      <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${resetUrl}</p>
    </div>
  `;
}