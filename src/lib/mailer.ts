import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  nome: string;
  validationUrl: string;
  expiresInMinutes: number;
};

type EmailVerificationInput = {
  to: string;
  nome: string;
  verificationUrl: string;
  expiresInMinutes: number;
};

function isDevelopmentEnvironment() {
  return process.env.NODE_ENV !== "production";
}

function getDevelopmentRecipient() {
  return process.env.DEV_EMAIL_REDIRECT_TO ?? "menezes.jrafael@gmail.com";
}

function resolveRecipient(originalRecipient: string) {
  if (!isDevelopmentEnvironment()) {
    return {
      to: originalRecipient,
      originalRecipient: null,
    };
  }

  return {
    to: getDevelopmentRecipient(),
    originalRecipient,
  };
}

function buildDevelopmentNotice(originalRecipient: string | null) {
  if (!originalRecipient) {
    return {
      text: [] as string[],
      html: "",
      subjectPrefix: "",
    };
  }

  return {
    text: [
      "[Ambiente de desenvolvimento]",
      `Destinatario original simulado: ${originalRecipient}`,
      "",
    ],
    html: `
      <p><strong>Ambiente de desenvolvimento</strong></p>
      <p>Destinatario original simulado: ${originalRecipient}</p>
      <hr />
    `,
    subjectPrefix: "[DEV] ",
  };
}

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
  const recipient = resolveRecipient(input.to);
  const developmentNotice = buildDevelopmentNotice(recipient.originalRecipient);

  await transport.sendMail({
    from,
    to: recipient.to,
    subject: `${developmentNotice.subjectPrefix}Recuperacao de senha - NossoSaldo`,
    text: [
      ...developmentNotice.text,
      `Ola, ${input.nome}.`,
      "",
      "Recebemos uma solicitacao para redefinir sua senha.",
      `Clique no link a seguir para validar a recuperacao: ${input.validationUrl}`,
      `Esse link expira em ${input.expiresInMinutes} minutos.`,
      "",
      "Se voce nao solicitou essa alteracao, ignore este email.",
    ].join("\n"),
    html: `
      ${developmentNotice.html}
      <p>Ola, ${input.nome}.</p>
      <p>Recebemos uma solicitacao para redefinir sua senha.</p>
      <p><a href="${input.validationUrl}">Clique aqui para validar a recuperacao de senha</a></p>
      <p>Esse link expira em ${input.expiresInMinutes} minutos.</p>
      <p>Se voce nao solicitou essa alteracao, ignore este email.</p>
    `,
  });
}

async function sendEmailVerificationEmail(input: EmailVerificationInput) {
  const from = getRequiredEnv("SMTP_FROM");
  const transport = buildTransport();
  const recipient = resolveRecipient(input.to);
  const developmentNotice = buildDevelopmentNotice(recipient.originalRecipient);

  await transport.sendMail({
    from,
    to: recipient.to,
    subject: `${developmentNotice.subjectPrefix}Confirme seu email - NossoSaldo`,
    text: [
      ...developmentNotice.text,
      `Ola, ${input.nome}.`,
      "",
      "Recebemos seu cadastro no NossoSaldo.",
      `Clique no link a seguir para confirmar seu email: ${input.verificationUrl}`,
      `Esse link expira em ${input.expiresInMinutes} minutos.`,
      "",
      "Se voce nao criou essa conta, ignore este email.",
    ].join("\n"),
    html: `
      ${developmentNotice.html}
      <p>Ola, ${input.nome}.</p>
      <p>Recebemos seu cadastro no NossoSaldo.</p>
      <p><a href="${input.verificationUrl}">Clique aqui para confirmar seu email</a></p>
      <p>Esse link expira em ${input.expiresInMinutes} minutos.</p>
      <p>Se voce nao criou essa conta, ignore este email.</p>
    `,
  });
}

export const mailer = {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
