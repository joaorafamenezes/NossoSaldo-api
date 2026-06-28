import "dotenv/config";
import { execSync } from "child_process";

const provider = (process.env.DATABASE_PROVIDER ?? "postgresql").toLowerCase();

if (provider !== "mysql" && provider !== "postgresql") {
  throw new Error(`DATABASE_PROVIDER invalido: ${provider}. Use mysql ou postgresql.`);
}

const command = process.platform === "win32" ? "npx.cmd prisma db push" : "npx prisma db push";

execSync(command, {
  stdio: "inherit",
});
