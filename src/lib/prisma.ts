import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __nossoSaldoPrisma__: PrismaClient | undefined;
}

export const prisma = globalThis.__nossoSaldoPrisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__nossoSaldoPrisma__ = prisma;
}
