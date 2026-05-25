import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import jwt, { TokenExpiredError, VerifyErrors, VerifyOptions } from "jsonwebtoken";

const jwtAlgorithm = "RS256";
const jwtExpires = parseInt(`${process.env.JWT_EXPIRES}`, 10);

if (Number.isNaN(jwtExpires)) {
  throw new Error("JWT_EXPIRES invalido");
}

function normalizePemFromEnv(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value.replace(/\\n/g, "\n").trim();
}

function readKeyFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), "keys", fileName);
  return fs.readFileSync(filePath, "utf-8").trim();
}

function resolveJwtKey(envName: "JWT_PRIVATE_KEY" | "JWT_PUBLIC_KEY", fileName: string) {
  const keyFromEnv = normalizePemFromEnv(process.env[envName]);

  if (keyFromEnv) {
    return keyFromEnv;
  }

  return readKeyFile(fileName);
}

const privateKey = resolveJwtKey("JWT_PRIVATE_KEY", "private.key");
const publicKey = resolveJwtKey("JWT_PUBLIC_KEY", "public.key");

export type Token = { id: string };

export type VerifyTokenResult =
  | { payload: Token; error: null }
  | { payload: null; error: "expired" | "invalid" };

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function tokenPrefix(token: string) {
  return token.slice(0, 24);
}

function mapVerifyError(error: unknown): "expired" | "invalid" {
  if (error instanceof TokenExpiredError) {
    return "expired";
  }

  const jwtError = error as VerifyErrors | undefined;

  if (jwtError?.name === "TokenExpiredError") {
    return "expired";
  }

  return "invalid";
}

async function verifyToken(token: string): Promise<VerifyTokenResult> {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [jwtAlgorithm],
    } as VerifyOptions) as Token;

    return { payload: { id: decoded.id }, error: null };
  } catch (error) {
    return { payload: null, error: mapVerifyError(error) };
  }
}

function sign(id: string) {
  try {
    const payload: Token = { id };

    return jwt.sign(payload, privateKey, {
      expiresIn: jwtExpires,
      algorithm: jwtAlgorithm,
    });
  } catch {
    return null;
  }
}

function getJwtDiagnostics() {
  return {
    algorithm: jwtAlgorithm,
    expiresInSeconds: jwtExpires,
    privateKeyFingerprint: fingerprint(privateKey),
    publicKeyFingerprint: fingerprint(publicKey),
  };
}

export default {
  verifyToken,
  sign,
  getJwtDiagnostics,
  tokenPrefix,
};
