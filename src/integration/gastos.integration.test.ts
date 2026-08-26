import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import autentication from "../secure/autentication";

const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const userEmail = `integration-${uniqueSuffix}@example.com`;

async function createAuthenticatedUser() {
  const user = await prisma.usuario.create({
    data: {
      nome: "Usuario Integracao",
      email: userEmail,
      senha: autentication.hasPassword("senha-integracao"),
      emailVerifiedAt: new Date(),
    },
  });

  const category = await prisma.categoria.create({
    data: {
      descricao: `Integracao ${uniqueSuffix}`,
      iconName: "tag",
    },
  });

  const loginResponse = await request(app)
    .post("/api/v1/login")
    .send({ email: userEmail, senha: "senha-integracao" });

  expect(loginResponse.status).toBe(200);

  return {
    user,
    category,
    token: loginResponse.body.data.accessToken as string,
  };
}

describe("gastos - fluxo integrado", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.lancamentoBase.deleteMany({
      where: { gasto: { descricao: { startsWith: "Integracao" } } },
    });
    await prisma.gasto.deleteMany({
      where: { descricao: { startsWith: "Integracao" } },
    });
    await prisma.categoria.deleteMany({
      where: { descricao: { startsWith: "Integracao" } },
    });
    await prisma.usuario.deleteMany({
      where: { email: { startsWith: "integration-" } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cria e lista somente o gasto do usuario autenticado", async () => {
    const { category, token } = await createAuthenticatedUser();

    const createResponse = await request(app)
      .post("/api/v1/gastosUsuarioLogado")
      .set("x-access-token", token)
      .send({
        descricao: "Integracao gasto listado",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        valor: 125.5,
        dataVencimento: "2026-08-20",
        categoriaId: category.id,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.descricao).toBe("Integracao gasto listado");

    const listResponse = await request(app)
      .get("/api/v1/gastos")
      .query({ de: "2026-08-01", ate: "2026-08-31" })
      .set("x-access-token", token);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta.total).toBe(1);
    expect(listResponse.body.data).toHaveLength(1);
    expect(Number(listResponse.body.data[0].valor)).toBeCloseTo(125.5, 2);
  });

  it("paga e reabre um gasto pela API, persistindo o estado no banco", async () => {
    const { category, token } = await createAuthenticatedUser();

    const createResponse = await request(app)
      .post("/api/v1/gastosUsuarioLogado")
      .set("x-access-token", token)
      .send({
        descricao: "Integracao ciclo pagamento",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        valor: 80,
        dataVencimento: "2026-08-20",
        categoriaId: category.id,
      });

    const gastoId = createResponse.body.data.id as string;

    const paymentResponse = await request(app)
      .patch(`/api/v1/pagarGastos/${gastoId}/pagamento`)
      .set("x-access-token", token)
      .send({ dataPagamento: "2026-08-15" });

    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.body.data.status).toBe("pago");

    const reopenedResponse = await request(app)
      .patch(`/api/v1/pagarGastos/${gastoId}/reabertura`)
      .set("x-access-token", token);

    expect(reopenedResponse.status).toBe(200);
    expect(reopenedResponse.body.data.status).toBe("pendente");

    const persisted = await prisma.gasto.findUnique({ where: { id: gastoId } });
    expect(persisted).toMatchObject({ status: "pendente", dataPagamento: null });
  });
});
