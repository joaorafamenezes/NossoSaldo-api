import "dotenv/config";
import { randomUUID } from "crypto";
import autentication from "../secure/autentication";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

type SeedUser = {
  email: string;
  nome: string;
  senha: string;
};

type SeedCategory = {
  descricao: string;
  iconName: string;
};

type SeedExpense = {
  id: string;
  descricao: string;
  tipo: "receita" | "despesa";
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  origemLancamento: "unico" | "recorrente" | "parcelado";
  numeroParcelas: number;
  naoCompartilhar: boolean;
  valor: number;
  competencia: Date | null;
  dataVencimento: Date | null;
  dataPagamento: Date | null;
  observacao: string;
  categoriaId: string;
  responsavelId: string;
};

const DEV_SEED_TAG = "[DEV_SEED]";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const DEFAULT_PASSWORD = "Dev@12345";

function getDatabaseHost() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL nao esta definida.");
  }

  return new URL(databaseUrl).hostname;
}

function assertDevelopmentSafety() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("A seed de desenvolvimento nao pode ser executada em NODE_ENV=production.");
  }

  const host = getDatabaseHost();

  if (!LOCAL_HOSTS.has(host) && process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Seed de desenvolvimento bloqueada fora de host local. Defina ALLOW_DEV_SEED=true se souber o que esta fazendo.");
  }
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function ensureUser(user: SeedUser) {
  const senhaHash = autentication.hasPassword(user.senha);
  const emailVerifiedAt = new Date();

  const usuario = await prisma.usuario.upsert({
    where: { email: user.email },
    create: {
      nome: user.nome,
      email: user.email,
      senha: senhaHash,
      emailVerifiedAt,
    },
    update: {
      nome: user.nome,
      senha: senhaHash,
      emailVerifiedAt,
    },
    select: { id: true },
  });

  return usuario.id;
}

async function ensureCategory(category: SeedCategory) {
  const existente = await prisma.categoria.findFirst({
    where: { descricao: category.descricao },
    select: { id: true },
  });

  if (existente) {
    return existente.id;
  }

  const categoria = await prisma.categoria.create({
    data: {
      descricao: category.descricao,
      iconName: category.iconName,
    },
    select: { id: true },
  });

  return categoria.id;
}

async function ensureJointAccount(nomeConta: string, usuario1Id: string, usuario2Id: string) {
  const existente = await prisma.contaConjunta.findFirst({
    where: {
      OR: [
        { usuario1Id, usuario2Id },
        { usuario1Id: usuario2Id, usuario2Id: usuario1Id },
      ],
    },
    select: { id: true },
  });

  if (existente) {
    await prisma.contaConjunta.update({
      where: { id: existente.id },
      data: {
        nomeConta,
        deletedAt: null,
      },
    });

    return existente.id;
  }

  const conta = await prisma.contaConjunta.create({
    data: {
      nomeConta,
      usuario1Id,
      usuario2Id,
    },
    select: { id: true },
  });

  return conta.id;
}

async function removeExistingSeedExpenses() {
  const gastos = await prisma.gasto.findMany({
    where: {
      observacao: {
        startsWith: DEV_SEED_TAG,
      },
    },
    select: { id: true },
  });

  if (gastos.length === 0) {
    return;
  }

  const ids = gastos.map((gasto) => gasto.id);

  await prisma.lancamentoBase.deleteMany({
    where: { gastoId: { in: ids } },
  });

  await prisma.gasto.deleteMany({
    where: { id: { in: ids } },
  });
}

async function insertExpense(expense: SeedExpense) {
  await prisma.gasto.create({
    data: {
      id: expense.id,
      descricao: expense.descricao,
      tipo: expense.tipo,
      status: expense.status,
      origemLancamento: expense.origemLancamento,
      numeroParcelas: expense.numeroParcelas,
      naoCompartilhar: expense.naoCompartilhar,
      valor: expense.valor,
      competencia: expense.competencia,
      dataVencimento: expense.dataVencimento,
      dataPagamento: expense.dataPagamento,
      observacao: expense.observacao,
      categoriaId: expense.categoriaId,
      responsavelId: expense.responsavelId,
      deletedAt: null,
    },
  });
}

async function seedDevelopmentData() {
  assertDevelopmentSafety();

  const currentMonth = firstDayOfCurrentMonth();
  const nextWeek = addDays(currentMonth, 7);
  const tenDays = addDays(currentMonth, 10);
  const fifteenDays = addDays(currentMonth, 15);
  const twentyDays = addDays(currentMonth, 20);

  const devSoloUserId = await ensureUser({
    email: "dev.solo@nossosaldo.local",
    nome: "Dev Solo",
    senha: DEFAULT_PASSWORD,
  });

  const devSharedOneId = await ensureUser({
    email: "dev.compartilhado1@nossosaldo.local",
    nome: "Dev Compartilhado 1",
    senha: DEFAULT_PASSWORD,
  });

  const devSharedTwoId = await ensureUser({
    email: "dev.compartilhado2@nossosaldo.local",
    nome: "Dev Compartilhado 2",
    senha: DEFAULT_PASSWORD,
  });

  const categoriaReceitaId = await ensureCategory({ descricao: "Receita Seed Dev", iconName: "💰" });
  const categoriaMoradiaId = await ensureCategory({ descricao: "Moradia Seed Dev", iconName: "🏠" });
  const categoriaMercadoId = await ensureCategory({ descricao: "Mercado Seed Dev", iconName: "🛒" });
  const categoriaTransporteId = await ensureCategory({ descricao: "Transporte Seed Dev", iconName: "🚗" });

  const contaConjuntaId = await ensureJointAccount("Conta Compartilhada Seed Dev", devSharedOneId, devSharedTwoId);

  await removeExistingSeedExpenses();

  const seedExpenses: SeedExpense[] = [
    {
      id: randomUUID(), descricao: "Salario de teste individual", tipo: "receita", status: "pago", origemLancamento: "recorrente", numeroParcelas: 1, naoCompartilhar: false, valor: 4500,
      competencia: currentMonth, dataVencimento: currentMonth, dataPagamento: currentMonth, observacao: `${DEV_SEED_TAG} Usuario individual: receita fixa`, categoriaId: categoriaReceitaId, responsavelId: devSoloUserId,
    },
    {
      id: randomUUID(), descricao: "Academia individual", tipo: "despesa", status: "pendente", origemLancamento: "recorrente", numeroParcelas: 1, naoCompartilhar: false, valor: 129.9,
      competencia: currentMonth, dataVencimento: nextWeek, dataPagamento: null, observacao: `${DEV_SEED_TAG} Usuario individual: despesa recorrente`, categoriaId: categoriaTransporteId, responsavelId: devSoloUserId,
    },
    {
      id: randomUUID(), descricao: "Aluguel compartilhado", tipo: "despesa", status: "pendente", origemLancamento: "recorrente", numeroParcelas: 1, naoCompartilhar: false, valor: 1800,
      competencia: currentMonth, dataVencimento: tenDays, dataPagamento: null, observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`, categoriaId: categoriaMoradiaId, responsavelId: devSharedOneId,
    },
    {
      id: randomUUID(), descricao: "Mercado da semana", tipo: "despesa", status: "pendente", origemLancamento: "unico", numeroParcelas: 1, naoCompartilhar: false, valor: 289.45,
      competencia: currentMonth, dataVencimento: fifteenDays, dataPagamento: null, observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`, categoriaId: categoriaMercadoId, responsavelId: devSharedOneId,
    },
    {
      id: randomUUID(), descricao: "Streaming pessoal", tipo: "despesa", status: "pendente", origemLancamento: "recorrente", numeroParcelas: 1, naoCompartilhar: true, valor: 49.9,
      competencia: currentMonth, dataVencimento: twentyDays, dataPagamento: null, observacao: `${DEV_SEED_TAG} Privado do usuario compartilhado 1`, categoriaId: categoriaMoradiaId, responsavelId: devSharedOneId,
    },
    {
      id: randomUUID(), descricao: "Internet compartilhada", tipo: "despesa", status: "pendente", origemLancamento: "recorrente", numeroParcelas: 1, naoCompartilhar: false, valor: 119.9,
      competencia: currentMonth, dataVencimento: tenDays, dataPagamento: null, observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`, categoriaId: categoriaMoradiaId, responsavelId: devSharedTwoId,
    },
    {
      id: randomUUID(), descricao: "Corrida por aplicativo", tipo: "despesa", status: "pendente", origemLancamento: "unico", numeroParcelas: 1, naoCompartilhar: true, valor: 62.4,
      competencia: currentMonth, dataVencimento: fifteenDays, dataPagamento: null, observacao: `${DEV_SEED_TAG} Privado do usuario compartilhado 2`, categoriaId: categoriaTransporteId, responsavelId: devSharedTwoId,
    },
  ];

  for (const expense of seedExpenses) {
    await insertExpense(expense);
  }

  logger.info({
    provider: process.env.DATABASE_PROVIDER ?? "postgresql",
    seededUsers: ["dev.solo@nossosaldo.local", "dev.compartilhado1@nossosaldo.local", "dev.compartilhado2@nossosaldo.local"],
    defaultPassword: DEFAULT_PASSWORD,
    activeJointAccountId: contaConjuntaId,
    totalSeedExpenses: seedExpenses.length,
  }, "Massa de desenvolvimento criada com sucesso.");
}

seedDevelopmentData()
  .catch((error) => {
    logger.error({ err: error }, "Erro ao criar a massa de desenvolvimento");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
