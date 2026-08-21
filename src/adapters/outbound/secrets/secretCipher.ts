import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import createHttpError from "http-errors";

const algorithm = "aes-256-gcm";

function encryptionKey() {
  const value = process.env.IA_ENCRYPTION_KEY;

  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
    throw createHttpError(503, "A criptografia das configuracoes de IA nao esta configurada.");
  }

  return Buffer.from(value, "hex");
}

export class SecretCipher {
  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(algorithm, encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

    return {
      value: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    };
  }

  decrypt(value: string, iv: string, authTag: string) {
    try {
      const decipher = createDecipheriv(algorithm, encryptionKey(), Buffer.from(iv, "base64"));
      decipher.setAuthTag(Buffer.from(authTag, "base64"));
      return Buffer.concat([decipher.update(Buffer.from(value, "base64")), decipher.final()]).toString("utf8");
    } catch {
      throw createHttpError(500, "Nao foi possivel descriptografar a configuracao de IA.");
    }
  }
}

export const secretCipher = new SecretCipher();
