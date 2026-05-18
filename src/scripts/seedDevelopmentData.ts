import "dotenv/config";
import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import { randomUUID } from "crypto";
import autentication from "../secure/autentication";
import { logger } from "../lib/logger";

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

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

function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL nao esta definida.");
  }

  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!database) {
    throw new Error("DATABASE_URL precisa informar o nome do banco.");
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

function assertDevelopmentSafety(config: DatabaseConfig) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("A seed de desenvolvimento nao pode ser executada em NODE_ENV=production.");
  }

  if (!LOCAL_HOSTS.has(config.host) && process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error(
      "Seed de desenvolvimento bloqueada fora de host local. Defina ALLOW_DEV_SEED=true se souber o que esta fazendo.",
    );
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

async function ensureUser(connection: mysql.Connection, user: SeedUser) {
  const [rows] = await connection.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM Usuario WHERE email = ? LIMIT 1",
    [user.email],
  );

  const senhaHash = autentication.hasPassword(user.senha);
  const emailVerifiedAt = new Date();

  if (rows.length > 0) {
    const id = rows[0].id;
    await connection.query(
      `
        UPDATE Usuario
        SET nome = ?, senha = ?, emailVerifiedAt = ?, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [user.nome, senhaHash, emailVerifiedAt, id],
    );
    return id;
  }

  const id = randomUUID();
  await connection.query(
    `
      INSERT INTO Usuario (id, nome, email, senha, emailVerifiedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [id, user.nome, user.email, senhaHash, emailVerifiedAt],
  );

  return id;
}

async function ensureCategory(connection: mysql.Connection, category: SeedCategory) {
  const [rows] = await connection.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM Categoria WHERE descricao = ? LIMIT 1",
    [category.descricao],
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const id = randomUUID();
  await connection.query(
    `
      INSERT INTO Categoria (id, descricao, iconName, createdAt, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [id, category.descricao, category.iconName],
  );

  return id;
}

async function ensureJointAccount(connection: mysql.Connection, nomeConta: string, usuario1Id: string, usuario2Id: string) {
  const [rows] = await connection.query<Array<RowDataPacket & { id: string }>>(
    `
      SELECT id
      FROM ContaConjunta
      WHERE (usuario1Id = ? AND usuario2Id = ?)
         OR (usuario1Id = ? AND usuario2Id = ?)
      LIMIT 1
    `,
    [usuario1Id, usuario2Id, usuario2Id, usuario1Id],
  );

  if (rows.length > 0) {
    const id = rows[0].id;
    await connection.query(
      `
        UPDATE ContaConjunta
        SET nomeConta = ?, deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [nomeConta, id],
    );
    return id;
  }

  const id = randomUUID();
  await connection.query(
    `
      INSERT INTO ContaConjunta (id, nomeConta, usuario1Id, usuario2Id, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [id, nomeConta, usuario1Id, usuario2Id],
  );

  return id;
}

async function removeExistingSeedExpenses(connection: mysql.Connection) {
  const [rows] = await connection.query<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM Gasto WHERE observacao LIKE ?",
    [`${DEV_SEED_TAG}%`],
  );

  if (rows.length === 0) {
    return;
  }

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");

  await connection.query(
    `DELETE FROM LancamentoBase WHERE gastoId IN (${placeholders})`,
    ids,
  );
  await connection.query(
    `DELETE FROM Gasto WHERE id IN (${placeholders})`,
    ids,
  );
}

async function insertExpense(connection: mysql.Connection, expense: SeedExpense) {
  await connection.query(
    `
      INSERT INTO Gasto (
        id,
        descricao,
        tipo,
        status,
        origemLancamento,
        numeroParcelas,
        naoCompartilhar,
        valor,
        competencia,
        dataVencimento,
        dataPagamento,
        observacao,
        categoriaId,
        responsavelId,
        deletedAt,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
    `,
    [
      expense.id,
      expense.descricao,
      expense.tipo,
      expense.status,
      expense.origemLancamento,
      expense.numeroParcelas,
      expense.naoCompartilhar,
      expense.valor,
      expense.competencia,
      expense.dataVencimento,
      expense.dataPagamento,
      expense.observacao,
      expense.categoriaId,
      expense.responsavelId,
    ],
  );
}

async function seedDevelopmentData() {
  const config = getDatabaseConfig();
  assertDevelopmentSafety(config);

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: false,
  });

  const currentMonth = firstDayOfCurrentMonth();
  const nextWeek = addDays(currentMonth, 7);
  const tenDays = addDays(currentMonth, 10);
  const fifteenDays = addDays(currentMonth, 15);
  const twentyDays = addDays(currentMonth, 20);

  try {
    await connection.beginTransaction();

    const devSoloUserId = await ensureUser(connection, {
      email: "dev.solo@nossosaldo.local",
      nome: "Dev Solo",
      senha: DEFAULT_PASSWORD,
    });

    const devSharedOneId = await ensureUser(connection, {
      email: "dev.compartilhado1@nossosaldo.local",
      nome: "Dev Compartilhado 1",
      senha: DEFAULT_PASSWORD,
    });

    const devSharedTwoId = await ensureUser(connection, {
      email: "dev.compartilhado2@nossosaldo.local",
      nome: "Dev Compartilhado 2",
      senha: DEFAULT_PASSWORD,
    });

    const categoriaReceitaId = await ensureCategory(connection, {
      descricao: "Receita Seed Dev",
      iconName: "💰",
    });
    const categoriaMoradiaId = await ensureCategory(connection, {
      descricao: "Moradia Seed Dev",
      iconName: "🏠",
    });
    const categoriaMercadoId = await ensureCategory(connection, {
      descricao: "Mercado Seed Dev",
      iconName: "🛒",
    });
    const categoriaTransporteId = await ensureCategory(connection, {
      descricao: "Transporte Seed Dev",
      iconName: "🚗",
    });

    const contaConjuntaId = await ensureJointAccount(
      connection,
      "Conta Compartilhada Seed Dev",
      devSharedOneId,
      devSharedTwoId,
    );

    await removeExistingSeedExpenses(connection);

    const seedExpenses: SeedExpense[] = [
      {
        id: randomUUID(),
        descricao: "Salario de teste individual",
        tipo: "receita",
        status: "pago",
        origemLancamento: "recorrente",
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 4500,
        competencia: currentMonth,
        dataVencimento: currentMonth,
        dataPagamento: currentMonth,
        observacao: `${DEV_SEED_TAG} Usuario individual: receita fixa`,
        categoriaId: categoriaReceitaId,
        responsavelId: devSoloUserId,
      },
      {
        id: randomUUID(),
        descricao: "Academia individual",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 129.9,
        competencia: currentMonth,
        dataVencimento: nextWeek,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Usuario individual: despesa recorrente`,
        categoriaId: categoriaTransporteId,
        responsavelId: devSoloUserId,
      },
      {
        id: randomUUID(),
        descricao: "Aluguel compartilhado",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 1800,
        competencia: currentMonth,
        dataVencimento: tenDays,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`,
        categoriaId: categoriaMoradiaId,
        responsavelId: devSharedOneId,
      },
      {
        id: randomUUID(),
        descricao: "Mercado da semana",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 289.45,
        competencia: currentMonth,
        dataVencimento: fifteenDays,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`,
        categoriaId: categoriaMercadoId,
        responsavelId: devSharedOneId,
      },
      {
        id: randomUUID(),
        descricao: "Streaming pessoal",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        numeroParcelas: 1,
        naoCompartilhar: true,
        valor: 49.9,
        competencia: currentMonth,
        dataVencimento: twentyDays,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Privado do usuario compartilhado 1`,
        categoriaId: categoriaMoradiaId,
        responsavelId: devSharedOneId,
      },
      {
        id: randomUUID(),
        descricao: "Internet compartilhada",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 119.9,
        competencia: currentMonth,
        dataVencimento: tenDays,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Compartilhado por ${contaConjuntaId}`,
        categoriaId: categoriaMoradiaId,
        responsavelId: devSharedTwoId,
      },
      {
        id: randomUUID(),
        descricao: "Corrida por aplicativo",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        numeroParcelas: 1,
        naoCompartilhar: true,
        valor: 62.4,
        competencia: currentMonth,
        dataVencimento: fifteenDays,
        dataPagamento: null,
        observacao: `${DEV_SEED_TAG} Privado do usuario compartilhado 2`,
        categoriaId: categoriaTransporteId,
        responsavelId: devSharedTwoId,
      },
    ];

    for (const expense of seedExpenses) {
      await insertExpense(connection, expense);
    }

    await connection.commit();

    logger.info(
      {
        database: config.database,
        seededUsers: [
          "dev.solo@nossosaldo.local",
          "dev.compartilhado1@nossosaldo.local",
          "dev.compartilhado2@nossosaldo.local",
        ],
        defaultPassword: DEFAULT_PASSWORD,
        activeJointAccountId: contaConjuntaId,
        totalSeedExpenses: seedExpenses.length,
      },
      "Massa de desenvolvimento criada com sucesso.",
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

seedDevelopmentData().catch((error) => {
  logger.error({ err: error }, "Erro ao criar a massa de desenvolvimento");
  process.exit(1);
});
