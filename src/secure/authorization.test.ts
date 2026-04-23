import authorization from "./authorization";
import jwt from "jsonwebtoken";

describe("authorization", () => {
  it("should sign and verify token successfully", async () => {
    const token = await authorization.sign("user-test-id");

    expect(token).toBeTruthy();

    const payload = await authorization.verifyToken(token as string);

    expect(payload).toEqual({ id: "user-test-id" });
  });

  it("should generate a token with RS256 header and configured expiration", async () => {
    const token = authorization.sign("user-test-id");

    expect(token).toBeTruthy();

    const decoded = jwt.decode(token as string, { complete: true }) as unknown as {
      header: { alg: string };
      payload: { id: string; exp: number; iat: number };
    };

    expect(decoded.header.alg).toBe("RS256");
    expect(decoded.payload.id).toBe("user-test-id");
    expect(decoded.payload.exp - decoded.payload.iat).toBe(Number(process.env.JWT_EXPIRES));
  });

  it("should return null for invalid token", async () => {
    const payload = await authorization.verifyToken("token-invalido");

    expect(payload).toBeNull();
  });

  it("should return null when token signature is tampered", async () => {
    const token = await authorization.sign("user-test-id");
    const tamperedToken = `${token}a`;

    const payload = await authorization.verifyToken(tamperedToken);

    expect(payload).toBeNull();
  });

  it("should return null when verifyToken throws a non-Error", async () => {
    jest.resetModules();
    jest.doMock("jsonwebtoken", () => ({
      __esModule: true,
      default: {
        verify: jest.fn(() => {
          throw "falha-bruta";
        }),
        sign: jest.fn(),
      },
    }));

    const mockedAuthorization = (await import("./authorization")).default;

    const payload = await mockedAuthorization.verifyToken("token-quebrado");

    expect(payload).toBeNull();
  });

  it("should return null when sign throws an Error", async () => {
    jest.resetModules();
    jest.doMock("jsonwebtoken", () => ({
      __esModule: true,
      default: {
        verify: jest.fn(),
        sign: jest.fn(() => {
          throw new Error("falha ao assinar");
        }),
      },
    }));

    const mockedAuthorization = (await import("./authorization")).default;

    const token = mockedAuthorization.sign("user-test-id");

    expect(token).toBeNull();
  });

  it("should return null when sign throws a non-Error", async () => {
    jest.resetModules();
    jest.doMock("jsonwebtoken", () => ({
      __esModule: true,
      default: {
        verify: jest.fn(),
        sign: jest.fn(() => {
          throw { code: "SIGN_FAILURE" };
        }),
      },
    }));

    const mockedAuthorization = (await import("./authorization")).default;

    const token = mockedAuthorization.sign("user-test-id");

    expect(token).toBeNull();
  });

  it("should throw during module initialization when JWT_EXPIRES is invalid", async () => {
    const previousJwtExpires = process.env.JWT_EXPIRES;

    jest.resetModules();
    process.env.JWT_EXPIRES = "invalid-number";

    await expect(import("./authorization")).rejects.toThrow(/JWT_EXPIRES/);

    process.env.JWT_EXPIRES = previousJwtExpires;
  });
});
