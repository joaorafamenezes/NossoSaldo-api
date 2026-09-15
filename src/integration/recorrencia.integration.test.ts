import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import autentication from "../secure/autentication";

describe("INTEGRAÇÃO: Gestão de Recorrências (BDD 001 & BDD 002)", () => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const userEmail = `qa-recorrencia-${uniqueSuffix}@example.com`;
  let token: string;
  let categoriaId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 1. Cria usuário e categoria reais de teste no banco
    const user = await prisma.usuario.create({
      data: {
        nome: "QA Recorrencia User",
        email: userEmail,
        senha: autentication.hasPassword("senha-qa-123"),
        emailVerifiedAt: new Date(),
      },
    });
    userId = user.id;

    const cat = await prisma.categoria.create({
      data: {
        descricao: `Categoria Recorrencia ${uniqueSuffix}`,
        iconName: "repeat",
      },
    });
    categoriaId = cat.id;

    // 2. Realiza login para obter JWT token
    const loginResponse = await request(app)
      .post("/api/v1/login")
      .send({ email: userEmail, senha: "senha-qa-123" });

    expect(loginResponse.status).toBe(200);
    token = loginResponse.body.data.accessToken as string;
  });

  afterEach(async () => {
    // Limpa lançamentos e gastos criados durante os testes do usuário
    await prisma.lancamentoBase.deleteMany({
      where: { gasto: { responsavelId: userId } },
    });
    await prisma.gasto.deleteMany({
      where: { responsavelId: userId },
    });
  });

  afterAll(async () => {
    // Limpeza final de lançamentos, gastos, categoria e usuário
    await prisma.lancamentoBase.deleteMany({
      where: { gasto: { responsavelId: userId } },
    });
    await prisma.gasto.deleteMany({
      where: { responsavelId: userId },
    });
    await prisma.categoria.deleteMany({ where: { id: categoriaId } });
    await prisma.usuario.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe("BDD 001: Cadastro com Sucesso", () => {
    it("Dado que o usuario está logado, Quando cadastrar um gasto recorrente, Então deverá persistir no banco e projetar nos meses subsequentes", async () => {
      const createResponse = await request(app)
        .post("/api/v1/gastosUsuarioLogado")
        .set("x-access-token", token)
        .send({
          descricao: `Assinatura Streaming ${uniqueSuffix}`,
          tipo: "despesa",
          status: "pendente",
          origemLancamento: "recorrente",
          valor: 55.9,
          dataVencimento: "2026-09-10",
          categoriaId,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.origemLancamento).toBe("recorrente");
      expect(Number(createResponse.body.data.valor)).toBeCloseTo(55.9, 2);

      const gastoId = createResponse.body.data.id;

      // 1. Verifica persistência real no banco de dados via Prisma
      const persisted = await prisma.gasto.findUnique({
        where: { id: gastoId },
      });
      expect(persisted).not.toBeNull();
      expect(persisted?.origemLancamento).toBe("recorrente");
      expect(Number(persisted?.valor)).toBeCloseTo(55.9, 2);

      // 2. Verifica listagem na competência atual (2026-09)
      const listAtual = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-09-01", ate: "2026-09-30" })
        .set("x-access-token", token);

      expect(listAtual.status).toBe(200);
      const itemAtual = listAtual.body.data.find(
        (g: any) => g.descricao === `Assinatura Streaming ${uniqueSuffix}`
      );
      expect(itemAtual).toBeDefined();
      expect(Number(itemAtual.valor)).toBeCloseTo(55.9, 2);

      // 3. Verifica listagem e projeção na competência seguinte (2026-10)
      const listFuturo = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-10-01", ate: "2026-10-31" })
        .set("x-access-token", token);

      expect(listFuturo.status).toBe(200);
      const itemFuturo = listFuturo.body.data.find(
        (g: any) => g.descricao === `Assinatura Streaming ${uniqueSuffix}`
      );
      expect(itemFuturo).toBeDefined();
      expect(Number(itemFuturo.valor)).toBeCloseTo(55.9, 2);
    });
  });

  describe("BDD 002: Atualização de Cadastro e Escopos de Recorrência", () => {
    it("002.1 - Escopo THIS_AND_FUTURE: Deve atualizar a competência alvo e propagar para todas as competências futuras, preservando o passado", async () => {
      // 1. Cria a série recorrente inicial em Agosto/2026
      const createResponse = await request(app)
        .post("/api/v1/gastosUsuarioLogado")
        .set("x-access-token", token)
        .send({
          descricao: `Internet Fibra ${uniqueSuffix}`,
          tipo: "despesa",
          status: "pendente",
          origemLancamento: "recorrente",
          valor: 100.0,
          dataVencimento: "2026-08-05",
          categoriaId,
        });

      expect(createResponse.status).toBe(201);
      const gastoRaizId = createResponse.body.data.id;

      // 2. Atualiza a competência de Setembro/2026 para R$ 130,00 com THIS_AND_FUTURE
      const updateResponse = await request(app)
        .patch(`/api/v1/gastos/${gastoRaizId}`)
        .set("x-access-token", token)
        .send({
          descricao: `Internet Fibra 500MB ${uniqueSuffix}`,
          valor: 130.0,
          dataVencimento: "2026-09-05",
          origemLancamento: "recorrente",
          escopoEdicao: "THIS_AND_FUTURE",
          targetCompetencia: "2026-09-05",
        });

      expect(updateResponse.status).toBe(200);

      // 3. Valida que a competência de Agosto/2026 permaneceu com o valor original R$ 100.00
      const listAgo = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-08-01", ate: "2026-08-31" })
        .set("x-access-token", token);

      expect(listAgo.status).toBe(200);
      const itemAgo = listAgo.body.data.find(
        (g: any) =>
          g.id === gastoRaizId ||
          g.recorrenciaPaiId === gastoRaizId ||
          g.descricao.includes("Internet Fibra")
      );
      expect(itemAgo).toBeDefined();
      expect(Number(itemAgo.valor)).toBeCloseTo(100.0, 2);

      // 4. Valida que a competência de Setembro/2026 recebeu o reajuste para R$ 130.00
      const listSet = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-09-01", ate: "2026-09-30" })
        .set("x-access-token", token);

      expect(listSet.status).toBe(200);
      const itemSet = listSet.body.data.find((g: any) =>
        g.descricao.includes("Internet Fibra")
      );
      expect(itemSet).toBeDefined();
      expect(Number(itemSet.valor)).toBeCloseTo(130.0, 2);

      // 5. Valida que a competência futura de Outubro/2026 reflete o novo valor R$ 130.00
      const listOut = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-10-01", ate: "2026-10-31" })
        .set("x-access-token", token);

      expect(listOut.status).toBe(200);
      const itemOut = listOut.body.data.find((g: any) =>
        g.descricao.includes("Internet Fibra")
      );
      expect(itemOut).toBeDefined();
      expect(Number(itemOut.valor)).toBeCloseTo(130.0, 2);
    });

    it("002.2 - Escopo THIS_ONLY: Deve atualizar pontualmente apenas a competência selecionada sem alterar o restante da série", async () => {
      // 1. Cria a série recorrente inicial (Conta de Energia R$ 200,00)
      const createResponse = await request(app)
        .post("/api/v1/gastosUsuarioLogado")
        .set("x-access-token", token)
        .send({
          descricao: `Conta de Energia ${uniqueSuffix}`,
          tipo: "despesa",
          status: "pendente",
          origemLancamento: "recorrente",
          valor: 200.0,
          dataVencimento: "2026-08-10",
          categoriaId,
        });

      expect(createResponse.status).toBe(201);
      const gastoRaizId = createResponse.body.data.id;

      // 2. Altera apenas a conta de Setembro/2026 para R$ 285,50 usando THIS_ONLY
      const updateResponse = await request(app)
        .patch(`/api/v1/gastos/${gastoRaizId}`)
        .set("x-access-token", token)
        .send({
          descricao: `Conta de Energia Bandeira Vermelha ${uniqueSuffix}`,
          valor: 285.5,
          dataVencimento: "2026-09-10",
          origemLancamento: "recorrente",
          escopoEdicao: "THIS_ONLY",
          targetCompetencia: "2026-09-10",
        });

      expect(updateResponse.status).toBe(200);

      // 3. Valida que Setembro/2026 possui o valor pontual de R$ 285,50
      const listSet = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-09-01", ate: "2026-09-30" })
        .set("x-access-token", token);

      expect(listSet.status).toBe(200);
      const itemSet = listSet.body.data.find((g: any) =>
        g.descricao.includes("Conta de Energia")
      );
      expect(itemSet).toBeDefined();
      expect(Number(itemSet.valor)).toBeCloseTo(285.5, 2);

      // 4. Valida que Outubro/2026 continua projetando o valor base de R$ 200,00
      const listOut = await request(app)
        .get("/api/v1/gastos")
        .query({ de: "2026-10-01", ate: "2026-10-31" })
        .set("x-access-token", token);

      expect(listOut.status).toBe(200);
      const itemOut = listOut.body.data.find((g: any) =>
        g.descricao.includes("Conta de Energia")
      );
      expect(itemOut).toBeDefined();
      expect(Number(itemOut.valor)).toBeCloseTo(200.0, 2);
    });

    it("002.3 - Conversão: Deve converter gasto recorrente para parcelado criando parcelas filhas no banco", async () => {
      // 1. Cria gasto recorrente
      const createResponse = await request(app)
        .post("/api/v1/gastosUsuarioLogado")
        .set("x-access-token", token)
        .send({
          descricao: `Curso de Idiomas ${uniqueSuffix}`,
          tipo: "despesa",
          status: "pendente",
          origemLancamento: "recorrente",
          valor: 300.0,
          dataVencimento: "2026-09-15",
          categoriaId,
        });

      const gastoId = createResponse.body.data.id;

      // 2. Converte para parcelado em 3x de R$ 100,00 (total R$ 300,00)
      const updateResponse = await request(app)
        .patch(`/api/v1/gastos/${gastoId}`)
        .set("x-access-token", token)
        .send({
          descricao: `Curso de Idiomas Parcelado ${uniqueSuffix}`,
          valor: 300.0,
          origemLancamento: "parcelado",
          numeroParcelas: 3,
          dataVencimento: "2026-09-15",
        });

      expect(updateResponse.status).toBe(200);

      // 3. Valida no banco se as 3 parcelas filhas (lancamentoBase) foram geradas
      const parcelas = await prisma.lancamentoBase.findMany({
        where: { gastoId },
        orderBy: { numeroParcela: "asc" },
      });

      expect(parcelas).toHaveLength(3);
      expect(parcelas[0].numeroParcela).toBe(1);
      expect(Number(parcelas[0].valorParcela)).toBeCloseTo(100.0, 2);
      expect(parcelas[1].numeroParcela).toBe(2);
      expect(Number(parcelas[1].valorParcela)).toBeCloseTo(100.0, 2);
      expect(parcelas[2].numeroParcela).toBe(3);
      expect(Number(parcelas[2].valorParcela)).toBeCloseTo(100.0, 2);
    });
  });
});
