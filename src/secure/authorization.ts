import "dotenv/config";
import jwt, { VerifyOptions } from "jsonwebtoken";
import fs from "fs";
import path from "path";

const jwtAlgorithm = "RS256";
const jwtExpires = Number(process.env.JWT_EXPIRES ?? 3600);

if (Number.isNaN(jwtExpires)) {
  throw new Error("JWT_EXPIRES inválido");
}

const publicKey = fs.readFileSync(
  path.resolve("./src/secure/keys/public.key"),
  "utf-8"
);

const privateKey = fs.readFileSync(
  path.resolve("./src/secure/keys/private.key"),
  "utf-8"
);

export type Token = { id: string };

async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [jwtAlgorithm],
    } as VerifyOptions) as Token;

    return { id: decoded.id };
  } catch (error) {
    if (error instanceof Error) {
      console.error("verifyToken error:", error.message);
    } else {
      console.error("verifyToken error:", error);
    }
    return null;
  }
}

async function sign(id: string) {
  try {
    const payload: Token = { id };

    return jwt.sign(payload, privateKey, {
      expiresIn: jwtExpires,
      algorithm: jwtAlgorithm,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("sign error:", error.message);
    } else {
      console.error("sign error:", error);
    }
    return null;
  }
}

export default {
  verifyToken,
  sign,
};