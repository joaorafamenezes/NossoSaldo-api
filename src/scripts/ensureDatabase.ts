import "dotenv/config";
import mysql from "mysql2/promise";
import { logger } from "../lib/logger";

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL não está definida.");
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

async function ensureDatabase() {
  const config = getDatabaseConfig();

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: false,
  });

  try {
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );

    logger.info({ database: config.database }, "Banco verificado/criado com sucesso.");
  } finally {
    await connection.end();
  }
}

ensureDatabase().catch((error) => {
  logger.error({ err: error }, "Erro ao garantir a criação do banco");
  process.exit(1);
});
