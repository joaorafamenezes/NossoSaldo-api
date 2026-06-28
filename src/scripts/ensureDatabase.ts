import "dotenv/config";
import mysql from "mysql2/promise";
import { Client as PostgresClient } from "pg";
import { logger } from "../lib/logger";

type SupportedProvider = "mysql" | "postgresql";

function getDatabaseProvider(): SupportedProvider {
  const provider = (process.env.DATABASE_PROVIDER ?? "postgresql").toLowerCase();

  if (provider !== "mysql" && provider !== "postgresql") {
    throw new Error(`DATABASE_PROVIDER invalido: ${provider}. Use mysql ou postgresql.`);
  }

  return provider;
}

function getDatabaseConfig() {
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
    port: Number(url.port || 0),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

async function ensureMySqlDatabase(config: ReturnType<typeof getDatabaseConfig>) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port || 3306,
    user: config.user,
    password: config.password,
    multipleStatements: false,
  });

  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } finally {
    await connection.end();
  }
}

async function ensurePostgresDatabase(config: ReturnType<typeof getDatabaseConfig>) {
  const client = new PostgresClient({
    host: config.host,
    port: config.port || 5432,
    user: config.user,
    password: config.password,
    database: "postgres",
  });

  await client.connect();

  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1", [config.database]);

    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${config.database.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

async function ensureDatabase() {
  const provider = getDatabaseProvider();
  const config = getDatabaseConfig();

  if (provider === "postgresql") {
    await ensurePostgresDatabase(config);
  } else {
    await ensureMySqlDatabase(config);
  }

  logger.info({ provider, database: config.database }, "Banco verificado/criado com sucesso.");
}

ensureDatabase().catch((error) => {
  logger.error({ err: error }, "Erro ao garantir a criacao do banco");
  process.exit(1);
});
