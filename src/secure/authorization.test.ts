import authorization from "./authorization";
import jwt from "jsonwebtoken";

describe("authorization", () => {
  it("should sign and verify token successfully", async () => {
    const token = await authorization.sign("user-test-id");

    expect(token).toBeTruthy();

    const result = await authorization.verifyToken(token as string);

    expect(result).toEqual({ payload: { id: "user-test-id" }, error: null });
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

  it("should return invalid for malformed token", async () => {
    const result = await authorization.verifyToken("token-invalido");

    expect(result).toEqual({ payload: null, error: "invalid" });
  });

  it("should return invalid when token signature is tampered", async () => {
    const token = await authorization.sign("user-test-id");
    const tamperedToken = `${token}a`;

    const result = await authorization.verifyToken(tamperedToken);

    expect(result).toEqual({ payload: null, error: "invalid" });
  });

  it("should return expired when jwt.verify raises TokenExpiredError", async () => {
    jest.resetModules();
    jest.doMock("jsonwebtoken", () => {
      const actual = jest.requireActual("jsonwebtoken");
      const actualDefault = actual.default ?? actual;
      return {
        __esModule: true,
        default: {
          verify: jest.fn(() => {
            throw new actual.TokenExpiredError("jwt expired", new Date("2026-04-29T15:00:00.000Z"));
          }),
          sign: actualDefault.sign,
        },
        TokenExpiredError: actual.TokenExpiredError,
      };
    });

    const mockedAuthorization = (await import("./authorization")).default;

    const result = await mockedAuthorization.verifyToken("token-expirado");

    expect(result).toEqual({ payload: null, error: "expired" });
  });

  it("should return invalid when verifyToken throws a non-Error", async () => {
    jest.resetModules();
    jest.doMock("jsonwebtoken", () => ({
      __esModule: true,
      default: {
        verify: jest.fn(() => {
          throw "falha-bruta";
        }),
        sign: jest.fn(),
      },
      TokenExpiredError: class TokenExpiredError extends Error {},
    }));

    const mockedAuthorization = (await import("./authorization")).default;

    const result = await mockedAuthorization.verifyToken("token-quebrado");

    expect(result).toEqual({ payload: null, error: "invalid" });
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
      TokenExpiredError: class TokenExpiredError extends Error {},
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
      TokenExpiredError: class TokenExpiredError extends Error {},
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
