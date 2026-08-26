import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __nossoSaldoPrisma__: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada");
}

const databaseProvider = (process.env.DATABASE_PROVIDER ?? "postgresql").toLowerCase();

if (databaseProvider !== "postgresql" && databaseProvider !== "mysql") {
  throw new Error("DATABASE_PROVIDER invalido. Use mysql ou postgresql.");
}

const adapter = databaseProvider === "mysql"
  ? new PrismaMariaDb(connectionString)
  : new PrismaPg({ connectionString });

// O schema e gerado dinamicamente para o provider configurado antes do build.
// O cast permite que o mesmo modulo suporte os dois adaptadores em tempo de execucao.
export const prisma = globalThis.__nossoSaldoPrisma__ ?? new PrismaClient({ adapter: adapter as never });

if (process.env.NODE_ENV !== "production") {
  globalThis.__nossoSaldoPrisma__ = prisma;
}
