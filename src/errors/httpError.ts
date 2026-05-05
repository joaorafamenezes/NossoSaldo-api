import createHttpError from "http-errors";

export function createValidationError(details: string[]) {
  return createHttpError(422, "Dados de entrada invalidos.", {
    code: "VALIDATION_ERROR",
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
    return createHttpError(409, "Registro ja existe.", {
      code: "CONFLICT",
      cause: error,
    });
  }

  return createHttpError(500, fallbackMessage, {
    code: "INTERNAL_SERVER_ERROR",
    cause: error,
  });
}
