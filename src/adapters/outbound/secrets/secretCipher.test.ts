import { secretCipher } from "./secretCipher";

describe("SecretCipher", () => {
  const originalKey = process.env.IA_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.IA_ENCRYPTION_KEY = "a".repeat(64);
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.IA_ENCRYPTION_KEY;
    else process.env.IA_ENCRYPTION_KEY = originalKey;
  });

  it("encrypts and decrypts a value with the configured key", () => {
    const encrypted = secretCipher.encrypt("sk-user-secret");

    expect(encrypted.value).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(secretCipher.decrypt(encrypted.value, encrypted.iv, encrypted.authTag)).toBe("sk-user-secret");
  });

  it("rejects encryption when the key is missing or malformed", () => {
    delete process.env.IA_ENCRYPTION_KEY;

    expect(() => secretCipher.encrypt("secret")).toThrow("A criptografia das configuracoes de IA nao esta configurada.");

    process.env.IA_ENCRYPTION_KEY = "not-a-hex-key";
    expect(() => secretCipher.encrypt("secret")).toThrow("A criptografia das configuracoes de IA nao esta configurada.");
  });

  it("maps invalid ciphertext to a safe server error", () => {
    expect(() => secretCipher.decrypt("invalid", "invalid", "invalid")).toThrow("Nao foi possivel descriptografar a configuracao de IA.");
  });
});
