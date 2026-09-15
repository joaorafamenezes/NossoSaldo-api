import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import autentication from "../secure/autentication";

describe("INTEGRAÇÃO: Motor JIT e Pausa de Recorrências (Fase 3)", () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const userEmail = `qa-jit-${uniqueSuffix}@example.com`;
  let token: string;
  let categoriaId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const user = await prisma.usuario.create({
      data: {
        nome: "QA JIT User",
        email: userEmail,
        senha: autentication.hasPassword("senha-qa-123"),
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;

    const cat = await prisma.categoria.create({
      data: {
        descricao: `Categoria JIT ${uniqueSuffix}`,
        iconName: "dumbbell",
      },
    });
    categoriaId = cat.id;

    const loginResponse = await request(app)
      .post("/api/v1/login")
      .send({ email: userEmail, senha: "senha-qa-123" });

    expect(loginResponse.status).toBe(200);
    token = loginResponse.body.data.accessToken as string;
  });

  afterEach(async () => {
    await prisma.gasto.deleteMany({ where: { responsavelId: userId } });
    await prisma.recorrencia.deleteMany({ where: { responsavelId: userId } });
  });

  afterAll(async () => {
    await prisma.gasto.deleteMany({ where: { responsavelId: userId } });
    await prisma.recorrencia.deleteMany({ where: { responsavelId: userId } });
    await prisma.categoria.deleteMany({ where: { id: categoriaId } });
    await prisma.usuario.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("deve criar regra de recorrencia, projetar JIT virtualmente, pausar e retomar com sucesso", async () => {
    // 1. Cria regra de recorrencia via endpoint dedicado
    const createRecResponse = await request(app)
      .post("/api/v1/recorrencias")
      .set("x-access-token", token)
      .send({
        descricao: `Academia Smart ${uniqueSuffix}`,
        tipo: "despesa",
        valor: 140.0,
        diaVencimento: 15,
        dataInicio: "2026-08-01",
        categoriaId,
      });

    expect(createRecResponse.status).toBe(201);
    const recorrenciaId = createRecResponse.body.data.id;
    expect(recorrenciaId).toBeDefined();

    // 2. Consulta listagem de gastos em Setembro/2026 -> Motor JIT deve retornar projecao virtual
    const listResponse1 = await request(app)
      .get("/api/v1/gastos")
      .query({ de: "2026-09-01", ate: "2026-09-30" })
      .set("x-access-token", token);

    expect(listResponse1.status).toBe(200);
    const itemSetembro = listResponse1.body.data.find(
      (g: any) => g.descricao === `Academia Smart ${uniqueSuffix}`
    );
    expect(itemSetembro).toBeDefined();
    expect(itemSetembro.isVirtual).toBe(true);
    expect(Number(itemSetembro.valor)).toBeCloseTo(140.0, 2);

    // 3. Pausa a recorrencia
    const pauseResponse = await request(app)
      .patch(`/api/v1/recorrencias/${recorrenciaId}/pausar`)
      .set("x-access-token", token)
      .send({
        motivoPausa: "Mes de ferias",
      });

    expect(pauseResponse.status).toBe(200);
    expect(pauseResponse.body.data.pausado).toBe(true);

    // 4. Consulta listagem de gastos novamente -> Motor JIT nao deve projetar o item pausado
    const listResponse2 = await request(app)
      .get("/api/v1/gastos")
      .query({ de: "2026-09-01", ate: "2026-09-30" })
      .set("x-access-token", token);

    expect(listResponse2.status).toBe(200);
    const itemSetembroPausado = listResponse2.body.data.find(
      (g: any) => g.descricao === `Academia Smart ${uniqueSuffix}`
    );
    expect(itemSetembroPausado).toBeUndefined();

    // 5. Retoma a recorrencia
    const resumeResponse = await request(app)
      .patch(`/api/v1/recorrencias/${recorrenciaId}/retomar`)
      .set("x-access-token", token);

    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body.data.pausado).toBe(false);

    // 6. Consulta listagem de gastos -> Motor JIT volta a projetar o item
    const listResponse3 = await request(app)
      .get("/api/v1/gastos")
      .query({ de: "2026-09-01", ate: "2026-09-30" })
      .set("x-access-token", token);

    expect(listResponse3.status).toBe(200);
    const itemSetembroRetomado = listResponse3.body.data.find(
      (g: any) => g.descricao === `Academia Smart ${uniqueSuffix}`
    );
    expect(itemSetembroRetomado).toBeDefined();
    expect(itemSetembroRetomado.isVirtual).toBe(true);
  });
});
