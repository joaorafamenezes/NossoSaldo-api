import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  nome: string;
  validationUrl: string;
  expiresInMinutes: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildTransport() {
  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const from = getRequiredEnv("SMTP_FROM");
  const transport = buildTransport();

  await transport.sendMail({
    from,
    to: input.to,
    subject: "Recuperacao de senha - NossoSaldo",
    text: [
      `Ola, ${input.nome}.`,
      "",
      "Recebemos uma solicitacao para redefinir sua senha.",
      `Clique no link a seguir para validar a recuperacao: ${input.validationUrl}`,
      `Esse link expira em ${input.expiresInMinutes} minutos.`,
      "",
      "Se voce nao solicitou essa alteracao, ignore este email.",
    ].join("\n"),
    html: `
      <p>Ola, ${input.nome}.</p>
      <p>Recebemos uma solicitacao para redefinir sua senha.</p>
      <p><a href="${input.validationUrl}">Clique aqui para validar a recuperacao de senha</a></p>
      <p>Esse link expira em ${input.expiresInMinutes} minutos.</p>
      <p>Se voce nao solicitou essa alteracao, ignore este email.</p>
    `,
  });
}

export const mailer = {
  sendPasswordResetEmail,
};
