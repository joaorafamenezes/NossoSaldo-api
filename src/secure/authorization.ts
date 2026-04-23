import "dotenv/config";
import jwt, { VerifyOptions } from "jsonwebtoken";
import fs from "fs";

const jwtAlgorithm = "RS256";
const jwtExpires = parseInt(`${process.env.JWT_EXPIRES}`);

if (Number.isNaN(jwtExpires)) {
  throw new Error("JWT_EXPIRES inválido");
}

const privateKey = fs.readFileSync('./keys/private.key', 'utf-8');
const publicKey = fs.readFileSync('./keys/public.key', 'utf-8');

export type Token = { id: string };

 async function verifyToken(token: string) {
  try {
    const decoded: Token = await jwt.verify(token, publicKey, {
      algorithms: [jwtAlgorithm]
    } as VerifyOptions) as Token;

    return { id: decoded.id };
  } catch {
    return null;
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

export default {
  verifyToken,
  sign
};
