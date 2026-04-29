import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import jwt, { TokenExpiredError, VerifyErrors, VerifyOptions } from "jsonwebtoken";

const jwtAlgorithm = "RS256";
const jwtExpires = parseInt(`${process.env.JWT_EXPIRES}`);

if (Number.isNaN(jwtExpires)) {
  throw new Error("JWT_EXPIRES invÃƒÂ¡lido");
}

const privateKey = fs.readFileSync("./keys/private.key", "utf-8");
const publicKey = fs.readFileSync("./keys/public.key", "utf-8");

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
