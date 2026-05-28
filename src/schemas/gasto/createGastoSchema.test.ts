import { createGastoSchema } from "./createGastoSchema";

describe("createGastoSchema", () => {
  const validPayload = {
    descricao: "Salario",
    tipo: "receita",
    status: "pendente",
    origemLancamento: "unico",
    valor: 1000,
    competencia: "2026-08-01",
    dataVencimento: "2026-08-17",
    categoriaId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("should accept a valid single expense with due date", () => {
    const result = createGastoSchema.validate(validPayload);

    expect(result.error).toBeUndefined();
  });

  it("should require due date for every expense type", () => {
    const { dataVencimento, ...payloadWithoutDueDate } = validPayload;

    const result = createGastoSchema.validate(payloadWithoutDueDate);

    expect(result.error?.message).toBe("A data de vencimento e obrigatoria para cadastrar um gasto.");
  });

  it("should require at least two installments for installment expenses", () => {
    const result = createGastoSchema.validate({
      ...validPayload,
      origemLancamento: "parcelado",
      numeroParcelas: 1,
    });

    expect(result.error?.message).toBe("O numero de parcelas deve ser pelo menos 2.");
  });

  it("should reject recurrence end date before due date", () => {
    const result = createGastoSchema.validate({
      ...validPayload,
      origemLancamento: "recorrente",
      dataVencimento: "2026-08-17",
      dataFimRecorrencia: "2026-08-01",
    });

    expect(result.error?.message).toBe("A data final da recorrencia nao pode ser anterior a data de vencimento inicial.");
  });
});
