import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const supportedProviders = new Set(["mysql", "postgresql"]);
const provider = (process.env.DATABASE_PROVIDER ?? "postgresql").toLowerCase();

if (!supportedProviders.has(provider)) {
  throw new Error(`DATABASE_PROVIDER invalido: ${provider}. Use mysql ou postgresql.`);
}

const prismaDir = join(process.cwd(), "prisma");
const templatePath = join(prismaDir, "schema.template.prisma");
const schemaPath = join(prismaDir, "schema.prisma");

const template = readFileSync(templatePath, "utf8");
const generated = template.replace("__DATABASE_PROVIDER__", provider);

writeFileSync(schemaPath, generated, "utf8");

console.log(`schema.prisma preparado para ${provider}.`);
