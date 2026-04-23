import createHttpError from "http-errors";

export function createValidationError(details: string[]) {
  return createHttpError(400, "Dados de entrada inválidos.", {
    details,
  });
}

export function createRepositoryError(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return createHttpError(409, "Registro já existe.", {
      cause: error,
    });
  }

  return createHttpError(500, fallbackMessage, {
    cause: error,
  });
}
